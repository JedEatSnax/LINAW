class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

const { existsSync } = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const fabricSchema = require('../validators/fabric/fabricSchema')
const AppError = require('../utils/AppError')
const fabricService = require('./fabric/assetRegistry')
const networkOrchestrator = require('./networkOrchestrator')

const backendDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(backendDir, '..')
const fabricSamplesDir = process.env.FABRIC_SAMPLES_DIR ?? path.resolve(repoRoot, 'fabric-samples')
const testNetworkDir = process.env.FABRIC_TEST_NETWORK_DIR ?? path.resolve(fabricSamplesDir, 'test-network')
const fabricBinDir = process.env.FABRIC_BIN_DIR ?? path.resolve(fabricSamplesDir, 'bin')

function buildPeerConfig(organization = 'org1') {
  const normalizedOrganization = organization === 'org2' ? 'org2' : 'org1'
  const peerName = normalizedOrganization === 'org2' ? 'peer0.org2.example.com' : 'peer0.org1.example.com'
  const organizationDomain = `${normalizedOrganization}.example.com`
  const organizationFolder = path.join(testNetworkDir, 'organizations', 'peerOrganizations', organizationDomain)
  const peerFolder = path.join(organizationFolder, 'peers', peerName)
  const mspDir = path.join(peerFolder, 'msp')
  const tlsDir = path.join(peerFolder, 'tls')
  const listenPort = normalizedOrganization === 'org2' ? '9051' : '7051'
  const chaincodePort = normalizedOrganization === 'org2' ? '9052' : '7052'
  const operationsPort = normalizedOrganization === 'org2' ? '9445' : '9444'
  const mspId = normalizedOrganization === 'org2' ? 'Org2MSP' : 'Org1MSP'
  const binaryPath = process.env.FABRIC_PEER_BIN ?? path.join(fabricBinDir, 'peer')

  return {
    organization: normalizedOrganization,
    peerName,
    binaryPath,
    env: {
      ...process.env,
      PATH: `${fabricBinDir}:${process.env.PATH ?? ''}`,
      FABRIC_CFG_PATH: process.env.FABRIC_CFG_PATH ?? path.resolve(repoRoot, 'fabric-samples', 'config'),
      CORE_PEER_TLS_ENABLED: 'true',
      CORE_PEER_PROFILE_ENABLED: 'false',
      CORE_PEER_TLS_CERT_FILE: path.join(tlsDir, 'server.crt'),
      CORE_PEER_TLS_KEY_FILE: path.join(tlsDir, 'server.key'),
      CORE_PEER_TLS_ROOTCERT_FILE: path.join(tlsDir, 'ca.crt'),
      CORE_PEER_ID: peerName,
      CORE_PEER_ADDRESS: `${peerName}:${listenPort}`,
      CORE_PEER_LISTENADDRESS: `0.0.0.0:${listenPort}`,
      CORE_PEER_CHAINCODEADDRESS: `${peerName}:${chaincodePort}`,
      CORE_PEER_CHAINCODELISTENADDRESS: `0.0.0.0:${chaincodePort}`,
      CORE_PEER_GOSSIP_BOOTSTRAP: `${peerName}:${listenPort}`,
      CORE_PEER_GOSSIP_EXTERNALENDPOINT: `${peerName}:${listenPort}`,
      CORE_PEER_LOCALMSPID: mspId,
      CORE_PEER_MSPCONFIGPATH: mspDir,
      CORE_OPERATIONS_LISTENADDRESS: `${peerName}:${operationsPort}`,
      CORE_METRICS_PROVIDER: 'prometheus'
    },
    requiredPaths: [mspDir, path.join(tlsDir, 'server.crt'), path.join(tlsDir, 'server.key'), path.join(tlsDir, 'ca.crt')]
  }
}

function startPeerNode(organization) {
  const config = buildPeerConfig(organization)

  for (const requiredPath of config.requiredPaths) {
    if (!existsSync(requiredPath)) {
      throw new AppError(
        `Missing Fabric artifacts at ${requiredPath}. Run ./network.sh up first.`,
        400,
        'FABRIC_ARTIFACTS_MISSING'
      )
    }
  }

  if (!existsSync(config.binaryPath)) {
    throw new AppError(
      `Fabric peer binary not found at ${config.binaryPath}`,
      500,
      'FABRIC_PEER_BINARY_NOT_FOUND'
    )
  }

  const child = spawn(config.binaryPath, ['node', 'start'], {
    cwd: testNetworkDir,
    env: config.env,
    detached: true,
    stdio: 'ignore'
  })

  child.unref()

  return {
    pid: child.pid,
    organization: config.organization,
    peerName: config.peerName,
    command: `${config.binaryPath} node start`
  }
}

class appFabricService {

  constructor() {
    this.schemas = fabricSchema
  }

  validate(schemaKey, data) {
    const schema = this.schemas[schemaKey];

    if (!schema) {
      throw new Error(`Validation schema not found for key: ${schemaKey}`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ValidationError(
        'Validation failed',
        error.details.map(d => d.message)
      );
    }

    return value;
  }

  async networkCreate({ config, user }) {
    const validated = this.validate('networkCreateSchema', { config })

    return await networkOrchestrator.provision({
      userID: user?.uid,
      config: validated.config
    })
  }

  async networkRead({ params, user }) {
    throw new AppError('Network read is not implemented', 501, 'NOT_IMPLEMENTED');
  }

  async channelCreate({ params, body, user }) {
    const validated = this.validate('channelCreateSchema', { params, body })

    const { id } = validated.params
    const { name, memberOrgs } = validated.body

    return await fabricService.channelCreate({
      id,
      name,
      memberOrgs,
      requestedBy: user?.uid
    })
  }

  async channelRead({ params, user }) {
    throw new AppError('Channel read is not implemented', 501, 'NOT_IMPLEMENTED');
  }

  async smartContract({ params, body, user }) {
    const validated = this.validate('smartContractSchema', { params, body })

    const { contractType, contractName, version } = validated.body

    return await fabricService.smartContract({
      channel_id: validated.params.channel_id,
      contractType,
      contractName,
      version,
      requestedBy: user?.uid
    })
  }

  async contractReadAll({ params, user }) {
    const validated = this.validate('contractReadAllSchema', { params })

    return await fabricService.contractReadAll({
      channel_id: validated.params.channel_id,
      requestedBy: user?.uid
    })
  }

  async peerNodeStart({ body, user }) {
    const validated = this.validate('peerNodeStartSchema', { body: body ?? {} })

    return startPeerNode(validated.body.organization)
  }

  async createAsset({ body, user }) {
    const validated = this.validate('createAssetSchema', { body })

    const { id, color, size, owner, appraisedValue } = validated.body

    return await fabricService.createAsset({
      id,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user?.uid
    })
  }

  async assetTransfer({ params, body, user }) {
    const validated = this.validate('assetTransferSchema', { params, body })

    const { id } = validated.params
    const { owner } = validated.body

    return await fabricService.assetTransfer({
      id,
      owner,
      requestedBy: user?.uid
    })
  }

  async assetUpdate({ params, body, user }) {
    const validated = this.validate('assetUpdateSchema', { params, body })

    const { id } = validated.params
    const { color, size, owner, appraisedValue } = validated.body

    return await fabricService.assetUpdate({
      id,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user?.uid
    })
  }

  async assetDelete({ params, user }) {
    const validated = this.validate('assetDeleteSchema', { params })

    const { id } = validated.params

    return await fabricService.assetDelete({
      id,
      requestedBy: user?.uid
    })
  }

  async assetRead({ params, user }) {
    const validated = this.validate('assetReadSchema', { params })

    const { id } = validated.params

    return await fabricService.assetRead({
      id,
      requestedBy: user?.uid
    })
  }

  async assetReadAll({ user }) {
    return await fabricService.assetReadAll({
      requestedBy: user?.uid
    })
  }

}

module.exports = new appFabricService();