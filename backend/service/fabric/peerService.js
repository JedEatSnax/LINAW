const { existsSync } = require("node:fs");
const path = require("node:path");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const { randomUUID } = require("node:crypto");

const { peerConfig } = require("../../config/peerConfig");
const { createHttpError } = require("../../utils/httpError");

const execAsync = promisify(exec);
const provisionedOrganizations = new Map();

function buildPeerConfig(organization = "org1") {
  const normalizedOrganization = organization === "org2" ? "org2" : "org1";
  const peerName =
    normalizedOrganization === "org2"
      ? "peer0.org2.example.com"
      : "peer0.org1.example.com";
  const organizationDomain = `${normalizedOrganization}.example.com`;
  const organizationFolder = path.join(
    peerConfig.testNetworkDir,
    "organizations",
    "peerOrganizations",
    organizationDomain,
  );
  const peerFolder = path.join(organizationFolder, "peers", peerName);
  const mspDir = path.join(peerFolder, "msp");
  const tlsDir = path.join(peerFolder, "tls");
  const dockerCommand = `${peerConfig.fabricDockerPeer} -d ${peerName} peer node start`;

  return {
    organization: normalizedOrganization,
    peerName,
    dockerCommand,
    requiredPaths: [
      mspDir,
      path.join(tlsDir, "server.crt"),
      path.join(tlsDir, "server.key"),
      path.join(tlsDir, "ca.crt"),
    ],
  };
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function validateContainerName(containerName) {
  const normalizedContainerName = String(containerName ?? "").trim();

  if (!normalizedContainerName) {
    throw createHttpError(400, "containerName is required");
  }

  if (!peerConfig.allowedContainerNames.has(normalizedContainerName)) {
    throw createHttpError(
      400,
      `Unsupported container ${normalizedContainerName}. Use one of: ${Array.from(peerConfig.allowedContainerNames).join(", ")}`,
    );
  }

  return normalizedContainerName;
}

async function startPeerNode(organization) {
  const config = buildPeerConfig(organization);

  for (const requiredPath of config.requiredPaths) {
    if (!existsSync(requiredPath)) {
      throw createHttpError(
        400,
        `Missing Fabric artifacts at ${requiredPath}. Run ./network.sh up first.`,
      );
    }
  }

  await execAsync(config.dockerCommand, {
    cwd: peerConfig.testNetworkDir,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    organization: config.organization,
    peerName: config.peerName,
    command: config.dockerCommand,
  };
}

async function runInContainer(containerName, command) {
  const normalizedContainerName = validateContainerName(containerName);
  const normalizedCommand = String(command ?? "").trim();

  if (!normalizedCommand) {
    throw createHttpError(400, "command is required");
  }

  const dockerCmd = `docker exec ${normalizedContainerName} sh -lc ${JSON.stringify(normalizedCommand)}`;

  try {
    const { stdout, stderr } = await execAsync(dockerCmd, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      containerName: normalizedContainerName,
      command: normalizedCommand,
      dockerCmd,
      stdout,
      stderr,
    };
  } catch (error) {
    throw createHttpError(
      error.code === 125 ? 400 : 500,
      error.stderr?.trim() ||
        error.message ||
        "Unable to run container command",
      {
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? "",
        exitCode: error.code,
        dockerCmd,
      },
    );
  }
}

function provisionOrganization(payload) {
  const organizationName = String(payload.organizationName ?? "").trim();
  const adminEmail = String(payload.adminEmail ?? "")
    .trim()
    .toLowerCase();
  const domainInput = String(payload.domain ?? "")
    .trim()
    .toLowerCase();
  const channelName = String(payload.channelName ?? "mychannel").trim();

  if (!organizationName) {
    throw createHttpError(400, "organizationName is required");
  }

  if (!adminEmail || !adminEmail.includes("@")) {
    throw createHttpError(400, "adminEmail must be a valid email address");
  }

  const slug = normalizeSlug(organizationName);
  if (!slug) {
    throw createHttpError(
      400,
      "organizationName must contain letters or numbers",
    );
  }

  if (provisionedOrganizations.has(slug)) {
    throw createHttpError(
      409,
      `Organization ${organizationName} already exists`,
    );
  }

  const domain =
    domainInput.length > 0 ? domainInput : `${slug}.linaw.example.com`;

  const mspId = `${slug.replace(/(^|-)(\w)/g, (_match, _dash, char) =>
    char.toUpperCase(),
  )}MSP`;

  const provisioned = {
    id: randomUUID(),
    organizationName,
    slug,
    mspId,
    domain,
    adminIdentity: {
      enrollmentId: `admin@${domain}`,
      email: adminEmail,
      secret: randomUUID().replace(/-/g, "").slice(0, 16),
      status: "issued",
    },
    networkAttachment: {
      channel: channelName || "mychannel",
      status: "requested",
    },
    createdAt: new Date().toISOString(),
  };

  provisionedOrganizations.set(slug, provisioned);

  return provisioned;
}

module.exports = {
  provisionOrganization,
  runInContainer,
  startPeerNode,
};
