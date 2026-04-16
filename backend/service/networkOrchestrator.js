const fs = require('fs-extra');
const { allocatePorts } = require('../utils/portManager');
const { initWorkspace, destroyWorkspace, getUserWorkspace } = require('../utils/workspace');
const { generateConfigtx, generateDockerCompose } = require('./configGenerator');
const { composeUp, composeDown, composeUpCA, composeDownWithVolumes } = require('./dockerCompose')
const { generateCryptoMaterial } = require('./cryptoMaterialGenerator')
const { createChannel, joinPeersToChannel, updateAnchorPeers } = require('./channelOrchestrator')
const { generateGenesisBlock } = require('./configtxgen')
const logger = require(`../utils/logger`);

/*
NOTE:
- workspace might get changed if I'm gonna implement vault
- might change logger since the output should be visible to the client not to the devs (logger is temporary)
- assignPorts still doesn't work :((
*/


function expectedContainerCount(config) {
  const caCount = config.orgs.length + 2;
  const peerCount = config.orgs.reduce((sum, o) => sum + o.peerCount, 0);
  return caCount + peerCount + peerCount + 1; // CAs + peers + couchdbs + orderer
}

async function assignPorts(config) {
  const ordererCount = config.ordererCount;
  const portsNeeded = 2 + ordererCount + config.orgs.reduce((sum) => sum + 2, 0);
  const ports = await allocatePorts(portsNeeded);
  let idx = 0;

  config.tlsCaPort = ports[idx++];
  config.ordererCaPort = ports[idx++];

  config.ordererPorts = [];
  for (let i = 0; i < ordererCount; i++) {
    config.ordererPorts.push(ports[idx++]);
  }
  config.ordererPort = config.ordererPorts[0];

  config.orgs = config.orgs.map(org => ({
    ...org,
    caPort: ports[idx++],
    peerPort: ports[idx++],
  }));

  return config;
}

// create a new blockchain network
async function provision(userId, rawConfig) {
  // assign available ports
  const config = await assignPorts({ ...rawConfig });
  const workspace = await initWorkspace(userId);

  try {

    // write network configuration
    logger.debug('[DEBUG] Writing network configuration')
    await fs.writeFile(`${workspace}/configtx.yaml`, generateConfigtx(config));
    await fs.writeFile(`${workspace}/docker-compose.yml`, generateDockerCompose(userId, config));

    // start CA only 
    logger.debug('[DEBUG] Starting CA ')
    await composeUpCA(workspace, userId)

    // generate all cert using fabric CA (might get changed and use vault instead,
    // it was recommended to use fabric CA for cert generation but imma look)
    logger.debug('[DEBUG] Generating certificates')
    await generateCryptoMaterial(workspace, config)

    logger.debug('[DEBUG] Generating genesis block')
    await generateGenesisBlock(workspace)

    logger.debug('[DEBUG] Starting Orderer + Peers')
    await composeUp(userId, workspace)

    logger.debug('[DEBUG] Creating Channel')
    await createChannel()

    logger.debug('[DEBUG] Joining Peers to channel')
    await joinPeersToChannel()

    logger.debug('[DEBUG] Updating Anchor Peers')
    await updateAnchorPeers()

    // need to get Docker container Ids
    // need to create a map for endpoints
    const containerIds = getContainerIds(userId)
    const endpoints = createEndpoints(config)

    logger.info(`[INFO] Network provisioning for ${userId} is done!`)
    return { config };

  } catch (err) {
    logger.error(`[ERROR] Provisioning failed for ${err.message}`);
    try {
      // docker compose down with volumes
      await composeDownWithVolumes(workspace, userId)
    } catch (_) { }
    throw err;
  }
}

// destroy a blockchain network
async function destroy() {

}

// stop the network and can be resumed
async function stop() {

}

async function createEndpoints(config) {

}


module.exports = { provision, destroy, stop };
