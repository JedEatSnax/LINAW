const fs = require("fs-extra");
const path = require("path");
const { execAsync } = require("../../utils/execAsync");
const logger = require("../../utils/logger");

function getProjectName(userId) {
  return `fabric-${userId}`;
}

function getComposeFile(workspace) {
  return path.join(workspace, "docker-compose.yml");
}

async function assertComposeFileExists(workspace) {
  const composeFile = getComposeFile(workspace);
  const exists = await fs.pathExists(composeFile);
  if (!exists) {
    throw new Error(`docker-compose.yml not found in workspace: ${workspace}`);
  }
}

function composeCmd(workspace, userId) {
  const composeFile = getComposeFile(workspace);
  const project = getProjectName(userId);
  return `docker compose -f "${composeFile}" --project-name ${project}`;
}

async function composeUp(workspace, userId, services = []) {
  await assertComposeFileExists(workspace);
  logger.info(`[INFO] Starting container for ${getProjectName(userId)}...`);
  const svcArgs = services && services.length ? ` ${services.join(" ")}` : "";
  await execAsync(`${composeCmd(workspace, userId)} up -d${svcArgs}`);
}

async function composeDown(workspace, userId) {
  await assertComposeFileExists(workspace);
  logger.info(`[INFO] Stopping container for ${getProjectName(userId)}...`);
  await execAsync(`${composeCmd(workspace, userId)} down --remove-orphans`);
}

async function composeStop(workspace, userId) {
  await assertComposeFileExists(workspace);
  logger.info(
    `[INFO] Stopping services for ${getProjectName(userId)} (resumable)...`,
  );
  await execAsync(`${composeCmd(workspace, userId)} stop`);
}

async function composeStart(workspace, userId) {
  await assertComposeFileExists(workspace);
  logger.info(
    `[INFO] Starting services for ${getProjectName(userId)} (resuming)...`,
  );
  await execAsync(`${composeCmd(workspace, userId)} start`);
}

async function listServices(workspace, userId) {
  await assertComposeFileExists(workspace);
  const { stdout } = await execAsync(
    `${composeCmd(workspace, userId)} config --services`,
  );
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function composeUpCA(workspace, userId) {
  logger.info(
    `[INFO] Starting CA container(s) for ${getProjectName(userId)}...`,
  );
  const services = await listServices(workspace, userId);
  const caServices = services.filter(
    (s) => s.startsWith("tls-ca-") || s.startsWith("ca-"),
  );
  if (!caServices.length) {
    throw new Error(
      `No CA services found for ${getProjectName(userId)} (compose config --services returned none matching ca-)`,
    );
  }
  await composeUp(workspace, userId, caServices);
}

async function composeDownWithVolumes(workspace, userId) {
  await assertComposeFileExists(workspace);
  logger.info(
    `[INFO] Destroying container + volumes for ${getProjectName(userId)}...`,
  );
  await execAsync(`${composeCmd(workspace, userId)} down -v --remove-orphans`);
}

async function getContainerIds(workspace, userId) {
  await assertComposeFileExists(workspace);
  const { stdout } = await execAsync(`${composeCmd(workspace, userId)} ps -q`);
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseDockerPortOutput(raw) {
  // Example lines: "7050/tcp -> 0.0.0.0:17050" or "7050/tcp -> :::17050"
  const out = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [containerPort, mapped] = trimmed.split(" -> ");
    if (!containerPort || !mapped) continue;
    const hostPort = mapped.split(":").pop();
    out.push({ containerPort, hostPort });
  }
  return out;
}

async function getContainers(workspace, userId) {
  await assertComposeFileExists(workspace);
  // Prefer the richer JSON format if supported by the local docker compose.
  try {
    const { stdout } = await execAsync(
      `${composeCmd(workspace, userId)} ps --format json`,
    );
    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed)) {
      return parsed.map((row) => ({
        service: row.Service,
        name: row.Name,
        id: row.ID,
        state: row.State,
        status: row.Status,
        ports: row.Publishers || [],
      }));
    }
  } catch (err) {
    logger.debug(
      "[DEBUG] compose ps --format json not available, falling back",
      { message: err.message },
    );
  }

  const ids = await getContainerIds(workspace, userId);
  const containers = [];
  for (const id of ids) {
    const { stdout: nameStdout } = await execAsync(
      `docker inspect --format '{{.Name}}' ${id}`,
    );
    const name = (nameStdout || "").trim().replace(/^\//, "");
    const { stdout: portStdout } = await execAsync(`docker port ${id}`);
    containers.push({
      id,
      name,
      // service name isn't available in this fallback; keep undefined.
      service: undefined,
      ports: parseDockerPortOutput(portStdout || ""),
    });
  }
  return containers;
}

module.exports = {
  composeUp,
  composeDown,
  composeStop,
  composeStart,
  composeUpCA,
  composeDownWithVolumes,
  getContainerIds,
  getContainers,
};
