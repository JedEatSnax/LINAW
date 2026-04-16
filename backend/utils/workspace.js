const path = require('path');
const fs = require('fs-extra');

function getUserWorkspace(userId) {
  return path.join(process.env.NETWORKS_PATH, userId);
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
