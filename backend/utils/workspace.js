const path = require('path');
const fs = require('fs-extra');

const BACKEND_ROOT = path.resolve(__dirname, '..');

function getWorkspacesRoot() {
  // IMPORTANT: Resolve relative paths against the backend root, not `process.cwd()`.
  // This prevents accidental pathing into `<repoRoot>/docker/.workspaces/...` when
  // orchestration is invoked from a different working directory.
  const raw = process.env.WORKSPACES_ROOT || process.env.NETWORKS_PATH || '../.workspaces';
  return path.isAbsolute(raw) ? raw : path.resolve(BACKEND_ROOT, raw);
}

function getUserWorkspace(userId) {
  return path.join(getWorkspacesRoot(), userId);
}

async function initWorkspace(userId) {
  const base = getUserWorkspace(userId);
  await fs.ensureDir(`${base}/crypto-config/tls-ca`);
  await fs.ensureDir(`${base}/crypto-config/ordererOrg/ca`);
  await fs.ensureDir(`${base}/crypto-config/ordererOrg/orderers/orderer/msp`);
  await fs.ensureDir(`${base}/crypto-config/ordererOrg/orderers/orderer/tls`);
  await fs.ensureDir(`${base}/crypto-config/ordererOrg/users/Admin/msp`);
  await fs.ensureDir(`${base}/channel-artifacts`);
  await fs.ensureDir(`${base}/chaincode`);
  return base;
}

async function destroyWorkspace(userId) {
  const base = getUserWorkspace(userId);
  await fs.remove(base);
}

module.exports = { getUserWorkspace, initWorkspace, destroyWorkspace };
