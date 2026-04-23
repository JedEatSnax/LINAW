import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(backendDir, "..");
const fabricSamplesDir =
  process.env.FABRIC_SAMPLES_DIR ?? path.resolve(repoRoot, "fabric-samples");
const testNetworkDir =
  process.env.FABRIC_TEST_NETWORK_DIR ??
  path.resolve(fabricSamplesDir, "test-network");
const fabricDockerPeer = process.env.FABRIC_DOCKER_PEER ?? "docker exec";

const provisionedOrganizations = new Map();
const execAsync = promisify(exec);
const allowedContainerNames = new Set([
  "ca_org1",
  "ca_org2",
  "ca_orderer",
  "peer0.org1.example.com",
  "peer0.org2.example.com",
  "orderer.example.com",
]);

function buildPeerConfig(organization = "org1") {
  const normalizedOrganization = organization === "org2" ? "org2" : "org1";
  const peerName =
    normalizedOrganization === "org2"
      ? "peer0.org2.example.com"
      : "peer0.org1.example.com";
  const organizationDomain = `${normalizedOrganization}.example.com`;
  const organizationFolder = path.join(
    testNetworkDir,
    "organizations",
    "peerOrganizations",
    organizationDomain,
  );
  const peerFolder = path.join(organizationFolder, "peers", peerName);
  const mspDir = path.join(peerFolder, "msp");
  const tlsDir = path.join(peerFolder, "tls");
  const dockerCommand = `${fabricDockerPeer} -d ${peerName} peer node start`;

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

export async function startPeerNode(organization) {
  const config = buildPeerConfig(organization);

  for (const requiredPath of config.requiredPaths) {
    if (!existsSync(requiredPath)) {
      const error = new Error(
        `Missing Fabric artifacts at ${requiredPath}. Run ./network.sh up first.`,
      );
      error.statusCode = 400;
      throw error;
    }
  }

  await execAsync(config.dockerCommand, {
    cwd: testNetworkDir,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    organization: config.organization,
    peerName: config.peerName,
    command: config.dockerCommand,
  };
}

function validateContainerName(containerName) {
  const normalizedContainerName = String(containerName ?? "").trim();

  if (!normalizedContainerName) {
    const error = new Error("containerName is required");
    error.statusCode = 400;
    throw error;
  }

  if (!allowedContainerNames.has(normalizedContainerName)) {
    const error = new Error(
      `Unsupported container ${normalizedContainerName}. Use one of: ${Array.from(allowedContainerNames).join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  return normalizedContainerName;
}

export async function runInContainer(containerName, command) {
  const normalizedContainerName = validateContainerName(containerName);
  const normalizedCommand = String(command ?? "").trim();

  if (!normalizedCommand) {
    const error = new Error("command is required");
    error.statusCode = 400;
    throw error;
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
    const wrappedError = new Error(
      error.stderr?.trim() ||
        error.message ||
        "Unable to run container command",
    );
    wrappedError.statusCode = error.code === 125 ? 400 : 500;
    wrappedError.stdout = error.stdout ?? "";
    wrappedError.stderr = error.stderr ?? "";
    wrappedError.exitCode = error.code;
    wrappedError.dockerCmd = dockerCmd;
    throw wrappedError;
  }
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function provisionOrganization(payload) {
  const organizationName = String(payload.organizationName ?? "").trim();
  const adminEmail = String(payload.adminEmail ?? "")
    .trim()
    .toLowerCase();
  const domainInput = String(payload.domain ?? "")
    .trim()
    .toLowerCase();
  const channelName = String(payload.channelName ?? "mychannel").trim();

  if (!organizationName) {
    const error = new Error("organizationName is required");
    error.statusCode = 400;
    throw error;
  }

  if (!adminEmail || !adminEmail.includes("@")) {
    const error = new Error("adminEmail must be a valid email address");
    error.statusCode = 400;
    throw error;
  }

  const slug = normalizeSlug(organizationName);
  if (!slug) {
    const error = new Error("organizationName must contain letters or numbers");
    error.statusCode = 400;
    throw error;
  }

  if (provisionedOrganizations.has(slug)) {
    const error = new Error(`Organization ${organizationName} already exists`);
    error.statusCode = 409;
    throw error;
  }

  const domain =
    domainInput.length > 0 ? domainInput : `${slug}.linaw.example.com`;
  const mspId = `${slug.replace(/(^|-)(\w)/g, (_match, _dash, c) => c.toUpperCase())}MSP`;
  const now = new Date().toISOString();

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
    createdAt: now,
  };

  provisionedOrganizations.set(slug, provisioned);

  return provisioned;
}
