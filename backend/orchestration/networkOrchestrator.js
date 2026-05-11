const fs = require('fs-extra');
const path = require('path');
const { allocatePorts } = require('../../utils/portManager');
const { initWorkspace, destroyWorkspace, getUserWorkspace } = require('../../utils/workspace');
const { generateConfigtx, generateDockerCompose } = require('./configGenerator');
const { composeUp, composeDown, composeStop, composeStart, composeUpCA, composeDownWithVolumes, getContainers } = require('./dockerCompose')
const { generateCryptoMaterial } = require('./cryptoMaterialGenerator')
const { createChannel, joinPeersToChannel, updateAnchorPeers } = require('./channelOrchestrator')
const { generateGenesisBlock, generateChannelTx } = require('./configtxgen')
const logger = require(`../../utils/logger`);

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

function safeSlug(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 64);
}

function resolveNetworkId(rawConfig) {

  const candidate = rawConfig && (rawConfig.networkId || rawConfig.name || rawConfig.channelId);
  const slug = safeSlug(candidate);
  return slug || `net-${Date.now()}`;
}

function getNetworkWorkspacePath(userWorkspace, networkId) {
  return path.join(userWorkspace, 'networks', networkId);
}

function stateFilePath(workspace) {
  return path.join(workspace, 'workspace-state.json');
}

function progressFilePath(workspace) {
  return path.join(workspace, 'progress.jsonl');
}

async function writeWorkspaceState(workspace, state) {
  await fs.writeJson(stateFilePath(workspace), state, { spaces: 2 });
}

async function readWorkspaceState(workspace) {
  const file = stateFilePath(workspace);
  const exists = await fs.pathExists(file);
  if (!exists) return null;
  return fs.readJson(file);
}

async function initNetworkWorkspace(userId, rawConfig) {
  const userWorkspace = await initWorkspace(userId);
  const networkId = resolveNetworkId(rawConfig);
  const workspace = getNetworkWorkspacePath(userWorkspace, networkId);
  await fs.ensureDir(workspace);


  await fs.ensureDir(path.join(workspace, 'crypto-config'));
  await fs.ensureDir(path.join(workspace, 'channel-artifacts'));

  return { userWorkspace, workspace, networkId };
}

function createProgressLogger(workspace) {
  return async function progress(event) {
    await fs.ensureDir(workspace);
    const enriched = {
      ts: new Date().toISOString(),
      ...event,
    };
    await fs.appendFile(progressFilePath(workspace), `${JSON.stringify(enriched)}\n`);
  };
}

async function safeRemoveWorkspace(userWorkspace, workspace) {
  const resolvedUser = path.resolve(userWorkspace);
  const resolvedTarget = path.resolve(workspace);
  if (!resolvedTarget.startsWith(resolvedUser + path.sep)) {
    throw new Error(`Refusing to remove workspace outside user workspace: ${workspace}`);
  }
  await fs.remove(workspace);
}

function applyPortDefaults(rawConfig) {
  return {
    ordererCount: 1,
    orgs: [],
    ...rawConfig,
  };
}

async function assignPorts(config) {
  const ordererCount = config.ordererCount || 1;
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
  const config = await assignPorts(applyPortDefaults({ ...rawConfig }));
  const { userWorkspace, workspace, networkId } = await initNetworkWorkspace(userId, rawConfig);
  const progress = createProgressLogger(workspace);

  const baseState = {
    userId,
    networkId,
    workspace,
    composeProject: `fabric-${userId}`,
    status: 'provisioning',
    config,
  };

  await writeWorkspaceState(workspace, baseState);
  await progress({ step: 'workspace.ready', networkId });

  try {

    // write network configuration
    logger.debug('[DEBUG] Writing network configuration')

    await fs.writeFile(`${workspace}/configtx.yaml`, generateConfigtx(config));
    await fs.writeFile(`${workspace}/docker-compose.yml`, generateDockerCompose(userId, config));
    await progress({ step: 'config.written' });

    // start CA only 
    logger.debug('[DEBUG] Starting CA ')
    await progress({ step: 'docker.ca.up' });
    await composeUpCA(workspace, userId)

    // generate all cert using fabric CA (might get changed and use vault instead,
    // it was recommended to use fabric CA for cert generation but imma look)
    logger.debug('[DEBUG] Generating certificates')
    await progress({ step: 'crypto.generate' });
    await generateCryptoMaterial(workspace, userId, config, { progress })

    logger.debug('[DEBUG] Generating genesis block')
    await progress({ step: 'configtxgen.genesis' });
    await generateGenesisBlock(workspace, config)


    await progress({ step: 'configtxgen.channelTx' });
    await generateChannelTx(workspace, config)

    logger.debug('[DEBUG] Starting Orderer + Peers')
    await progress({ step: 'docker.network.up' });
    await composeUp(workspace, userId)

    logger.debug('[DEBUG] Creating Channel')
    await createChannel(workspace, userId, config, { progress })

    logger.debug('[DEBUG] Joining Peers to channel')
    await joinPeersToChannel(workspace, userId, config, { progress })

    logger.debug('[DEBUG] Updating Anchor Peers')
    await updateAnchorPeers(workspace, userId, config, { progress })

    // need to get Docker container Ids
    // need to create a map for endpoints
    await progress({ step: 'endpoints.collect' });
    const endpoints = await createEndpoints(workspace, userId, config)

    const finalState = {
      ...(await readWorkspaceState(workspace)),
      status: 'ready',
      endpoints,
    };
    await writeWorkspaceState(workspace, finalState);
    await progress({ step: 'provision.done' });

    logger.info(`[INFO] Network provisioning for ${userId} is done!`)
    return { config, endpoints, workspace, networkId };

  } catch (err) {
    logger.error(`[ERROR] Provisioning failed for ${err.message}`);
    try { await progress({ step: 'provision.error', message: err.message }); } catch (_) {}
    try {
      // docker compose down with volumes
      await composeDownWithVolumes(workspace, userId)
    } catch (_) { }
    try {
      await safeRemoveWorkspace(userWorkspace, workspace)
    } catch (_) { }
    throw err;
  }
}

// destroy a blockchain network
async function destroy(userId, networkId, opts = {}) {
  const userWorkspace = await getUserWorkspace(userId);
  const workspace = getNetworkWorkspacePath(userWorkspace, networkId);
  const progress = createProgressLogger(workspace);
  await progress({ step: 'destroy.start', networkId });

  try {
    await composeDownWithVolumes(workspace, userId)
  } catch (_) { }


  await safeRemoveWorkspace(userWorkspace, workspace)

  if (opts.destroyUserWorkspace) {
    await destroyWorkspace(userId)
  }
}

// stop the network and can be resumed
async function stop(userId, networkId) {
  const userWorkspace = await getUserWorkspace(userId);
  const workspace = getNetworkWorkspacePath(userWorkspace, networkId);
  const progress = createProgressLogger(workspace);
  await progress({ step: 'stop.start', networkId });

  await composeStop(workspace, userId)

  const state = (await readWorkspaceState(workspace)) || { userId, networkId, workspace };
  state.status = 'stopped';
  await writeWorkspaceState(workspace, state);
  await progress({ step: 'stop.done', networkId });
}

async function createEndpoints(workspace, userId, config) {
  const containers = await getContainers(workspace, userId)
  const byName = new Map((containers || []).map(c => [c.name, c]))

  const endpoints = {
    composeProject: `fabric-${userId}`,
    workspace,
    tlsCa: {
      containerName: `tls-ca-${userId}`,
      containerId: byName.get(`tls-ca-${userId}`)?.id,
      url: `https://localhost:${config.tlsCaPort}`,
    },
    ordererCa: {
      containerName: `ca-orderer-${userId}`,
      containerId: byName.get(`ca-orderer-${userId}`)?.id,
      url: `https://localhost:${config.ordererCaPort}`,
    },
    orgs: (config.orgs || []).map(org => ({
      name: org.name,
      mspId: org.mspId,
      ca: {
        containerName: `ca-${org.name}-${userId}`,
        containerId: byName.get(`ca-${org.name}-${userId}`)?.id,
        url: `https://localhost:${org.caPort}`,
      },
      peers: Array.from({ length: org.peerCount }, (_, i) => ({
        name: `peer${i}.${org.name}`,
        containerName: `peer${i}-${org.name}-${userId}`,
        containerId: byName.get(`peer${i}-${org.name}-${userId}`)?.id,
        url: `grpcs://localhost:${org.peerPort + i * 10}`,
        port: org.peerPort + i * 10,
      })),
    })),
    orderers: Array.from({ length: config.ordererCount || 1 }, (_, i) => {
      const ordererLabel = i === 0 ? 'orderer' : `orderer${i + 1}`
      const containerName = `${ordererLabel}-${userId}`
      return {
        name: ordererLabel,
        containerName,
        containerId: byName.get(containerName)?.id,
        url: `grpcs://localhost:${config.ordererPort + i * 10}`,
        port: config.ordererPort + i * 10,
      }
    }),
    containers: (containers || []).map(c => ({
      id: c.id,
      name: c.name,
      service: c.service,
      state: c.state,
      status: c.status,
      ports: c.ports,
    })),
  }

  await fs.writeJson(path.join(workspace, 'endpoints.json'), endpoints, { spaces: 2 })
  return endpoints
}


module.exports = { provision, destroy, stop };
