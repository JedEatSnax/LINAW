const { existsSync } = require("node:fs");
const path = require("node:path");
const { exec, execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { randomUUID } = require("node:crypto");

const { peerConfig } = require("../../config/peerConfig");
const AppError = require("../../utils/AppError");
const {
  validateProvisionOrganizationPayload,
  validateRunInContainerInput,
} = require("../../validators/peer/provisionSchema");

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
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

async function startPeerNode(organization) {
  const config = buildPeerConfig(organization);

  for (const requiredPath of config.requiredPaths) {
    if (!existsSync(requiredPath)) {
      throw new AppError(
        `Missing Fabric artifacts at ${requiredPath}. Run ./network.sh up first.`,
        400,
        "MISSING_FABRIC_ARTIFACTS",
        { requiredPath },
      );
    }
  }

  try {
    await execAsync(config.dockerCommand, {
      cwd: peerConfig.testNetworkDir,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    throw new AppError(
      error?.stderr?.trim() || error?.message || "Unable to start peer node",
      500,
      "PEER_NODE_START_FAILED",
      {
        stdout: error?.stdout ?? "",
        stderr: error?.stderr ?? "",
        exitCode: error?.code,
        command: config.dockerCommand,
        peerName: config.peerName,
        organization: config.organization,
      },
    );
  }

  return {
    organization: config.organization,
    peerName: config.peerName,
    command: config.dockerCommand,
  };
}

async function runInContainer(containerName, command) {
  const validated = validateRunInContainerInput(
    containerName,
    command,
    peerConfig.allowedContainerNames,
  );

  const dockerArgs = ["exec", validated.containerName, "sh", "-lc", validated.command];
  const dockerCmdDisplay = `docker ${dockerArgs.map((arg) => JSON.stringify(arg)).join(" ")}`;

  try {
    const { stdout, stderr } = await execFileAsync("docker", dockerArgs, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      containerName: validated.containerName,
      command: validated.command,
      dockerCmd: dockerCmdDisplay,
      stdout,
      stderr,
    };
  } catch (error) {
    const statusCode = error?.code === 125 ? 400 : 500;
    throw new AppError(
      error?.stderr?.trim() || error?.message || "Unable to run container command",
      statusCode,
      "CONTAINER_COMMAND_FAILED",
      {
        stdout: error?.stdout ?? "",
        stderr: error?.stderr ?? "",
        exitCode: error?.code,
        dockerCmd: dockerCmdDisplay,
      },
    );
  }
}

function provisionOrganization(payload) {
  const validated = validateProvisionOrganizationPayload(payload);

  const slug = normalizeSlug(validated.organizationName);

  if (provisionedOrganizations.has(slug)) {
    throw new AppError(
      `Organization ${validated.organizationName} already exists`,
      409,
      "ORG_ALREADY_EXISTS",
      { slug },
    );
  }

  const domain =
    validated.domain.length > 0
      ? validated.domain
      : `${slug}.linaw.example.com`;

  const mspId = `${slug.replace(/(^|-)(\w)/g, (_match, _dash, char) =>
    char.toUpperCase(),
  )}MSP`;

  const provisioned = {
    id: randomUUID(),
    organizationName: validated.organizationName,
    slug,
    mspId,
    domain,
    adminIdentity: {
      enrollmentId: `admin@${domain}`,
      email: validated.adminEmail,
      secret: randomUUID().replace(/-/g, "").slice(0, 16),
      status: "issued",
    },
    networkAttachment: {
      channel: validated.channelName || "mychannel",
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
