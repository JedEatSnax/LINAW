const path = require("path");
const fs = require("fs-extra");
const { execAsync } = require("../../utils/execAsync");
const logger = require("../../utils/logger");

function getFabricToolsImage() {
  const fabricVersion = process.env.FABRIC_VERSION || "2.5";
  return `hyperledger/fabric-tools:${fabricVersion}`;
}

function getChannelId(config) {
  return config && config.channelId ? config.channelId : "mainchannel";
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function runConfigtxgen(workspace, script) {
  const img = getFabricToolsImage();
  const cmd = [
    "docker run --rm",
    `-v "${workspace}:/workspace"`,
    "--workdir /workspace",
    img,
    "bash -lc",
    shellQuote(script),
  ].join(" ");

  return execAsync(cmd);
}

async function ensureArtifactsDir(workspace) {
  const dir = path.join(workspace, "channel-artifacts");
  await fs.ensureDir(dir);
  return dir;
}

async function generateGenesisBlock(workspace, config = {}) {
  const artifactsDir = await ensureArtifactsDir(workspace);
  const systemChannelId = config.systemChannelId || "system-channel";

  logger.debug("[DEBUG] configtxgen: generating genesis.block", {
    workspace,
    systemChannelId,
  });
  await runConfigtxgen(
    workspace,
    [
      "set -euo pipefail",
      "export FABRIC_CFG_PATH=/workspace",
      `configtxgen -profile OrdererGenesis -channelID ${shellQuote(systemChannelId)} -outputBlock /workspace/channel-artifacts/genesis.block`,
    ].join("\n"),
  );

  return path.join(artifactsDir, "genesis.block");
}

async function generateChannelTx(workspace, config = {}) {
  const artifactsDir = await ensureArtifactsDir(workspace);
  const channelId = getChannelId(config);

  logger.debug("[DEBUG] configtxgen: generating channel tx", {
    workspace,
    channelId,
  });
  await runConfigtxgen(
    workspace,
    [
      "set -euo pipefail",
      "export FABRIC_CFG_PATH=/workspace",
      `configtxgen -profile MainChannel -channelID ${shellQuote(channelId)} -outputCreateChannelTx /workspace/channel-artifacts/${channelId}.tx`,
    ].join("\n"),
  );

  return path.join(artifactsDir, `${channelId}.tx`);
}

async function generateAnchorPeerUpdateTx(workspace, config = {}, org) {
  const artifactsDir = await ensureArtifactsDir(workspace);
  const channelId = getChannelId(config);
  if (!org || !org.mspId || !org.name) {
    throw new Error(
      "generateAnchorPeerUpdateTx requires org with { name, mspId }",
    );
  }

  const outFile = `${org.name}-anchors.tx`;
  logger.debug("[DEBUG] configtxgen: generating anchor peer update", {
    workspace,
    channelId,
    org: org.name,
  });

  await runConfigtxgen(
    workspace,
    [
      "set -euo pipefail",
      "export FABRIC_CFG_PATH=/workspace",
      `configtxgen -profile MainChannel -channelID ${shellQuote(channelId)} -asOrg ${shellQuote(org.mspId)} -outputAnchorPeersUpdate /workspace/channel-artifacts/${outFile}`,
    ].join("\n"),
  );

  return path.join(artifactsDir, outFile);
}

module.exports = {
  generateGenesisBlock,
  generateChannelTx,
  generateAnchorPeerUpdateTx,
};
