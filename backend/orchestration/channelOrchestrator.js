const fs = require('fs-extra');
const path = require('path');
const { execAsync } = require('../../utils/execAsync');
const logger = require('../../utils/logger');

function getFabricToolsImage() {
	const fabricVersion = process.env.FABRIC_VERSION || '2.5';
	return `hyperledger/fabric-tools:${fabricVersion}`;
}

function getProjectNetwork(userId) {
	return `fabric-${userId}`;
}

function shellQuote(value) {
	return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function getChannelId(config) {
	return (config && config.channelId) ? config.channelId : 'mainchannel';
}

function getPrimaryOrdererLabel() {
	return 'orderer';
}

function getChannelArtifactsDir(workspace) {
	return path.join(workspace, 'channel-artifacts');
}

function getPeerMspPath(org) {
	return `/workspace/crypto-config/${org.name}/users/Admin@${org.name}/msp`;
}

function getPeerTlsRootCertPath(org, peerIndex) {
	return `/workspace/crypto-config/${org.name}/peers/peer${peerIndex}/tls/tlscacerts/tls-cert.pem`;
}

function getOrdererTlsRootCertPath() {
	return '/workspace/crypto-config/ordererOrg/orderers/orderer/tls/tlscacerts/tls-cert.pem';
}

async function assertFileExists(filePath, hint) {
	const exists = await fs.pathExists(filePath);
	if (!exists) {
		throw new Error(`${hint || 'Required file missing'}: ${filePath}`);
	}
}

async function runPeerCommand(workspace, userId, script) {
	const img = getFabricToolsImage();
	const network = getProjectNetwork(userId);
	const cmd = [
		'docker run --rm',
		`--network ${network}`,
		`-v "${workspace}:/workspace"`,
		'--workdir /workspace',
		img,
		'bash -lc',
		shellQuote(`set -euo pipefail\n${script}`),
	].join(' ');

	return execAsync(cmd);
}

async function createChannel(workspace, userId, config, opts = {}) {
	const channelId = getChannelId(config);
	const progress = typeof opts.progress === 'function' ? opts.progress : null;
	const channelTxPath = path.join(getChannelArtifactsDir(workspace), `${channelId}.tx`);
	const ordererHost = getPrimaryOrdererLabel();
	const ordererCa = getOrdererTlsRootCertPath();

	await assertFileExists(channelTxPath, 'Channel create transaction not found');

	logger.info(`[INFO] Creating channel ${channelId} for ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.create.start', channelId });

	const result = await runPeerCommand(
		workspace,
		userId,
		[
			`export ORDERER_CA=${shellQuote(ordererCa)}`,
			`peer channel create -o ${shellQuote(`${ordererHost}:7050`)} --ordererTLSHostnameOverride ${shellQuote(ordererHost)} --tls --cafile "$ORDERER_CA" -c ${shellQuote(channelId)} -f ${shellQuote(`/workspace/channel-artifacts/${channelId}.tx`)}`,
		].join('\n')
	);

	if (progress) await progress({ step: 'channel.create.done', channelId });
	return { channelId, orderer: ordererHost, stdout: result?.stdout, stderr: result?.stderr };
}

async function joinPeersToChannel(workspace, userId, config, opts = {}) {
	const channelId = getChannelId(config);
	const progress = typeof opts.progress === 'function' ? opts.progress : null;
	const ordererHost = getPrimaryOrdererLabel();
	const ordererCa = getOrdererTlsRootCertPath();
	const results = [];

	logger.info(`[INFO] Joining peers to ${channelId} for ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.join.start', channelId });

	for (const org of (config.orgs || [])) {
		for (let peerIndex = 0; peerIndex < (org.peerCount || 0); peerIndex++) {
			const peerAddress = `peer${peerIndex}.${org.name}:7051`;
			const blockPath = `/workspace/channel-artifacts/${channelId}-${org.name}-peer${peerIndex}.block`;
			const script = [
				`export ORDERER_CA=${shellQuote(ordererCa)}`,
				`export CORE_PEER_LOCALMSPID=${shellQuote(org.mspId)}`,
				`export CORE_PEER_MSPCONFIGPATH=${shellQuote(getPeerMspPath(org))}`,
				`export CORE_PEER_TLS_ENABLED=true`,
				`export CORE_PEER_ADDRESS=${shellQuote(peerAddress)}`,
				`export CORE_PEER_TLS_ROOTCERT_FILE=${shellQuote(getPeerTlsRootCertPath(org, peerIndex))}`,
				`peer channel fetch 0 ${shellQuote(blockPath)} -o ${shellQuote(`${ordererHost}:7050`)} --ordererTLSHostnameOverride ${shellQuote(ordererHost)} --tls --cafile "$ORDERER_CA" -c ${shellQuote(channelId)}`,
				`peer channel join -b ${shellQuote(blockPath)}`,
			].join('\n');

			logger.debug('[DEBUG] channel join peer', { org: org.name, peerIndex, peerAddress, channelId });
			const result = await runPeerCommand(workspace, userId, script);
			results.push({ org: org.name, peerIndex, peerAddress, stdout: result?.stdout, stderr: result?.stderr });
			if (progress) await progress({ step: 'channel.join.peer', channelId, org: org.name, peerIndex });
		}
	}

	if (progress) await progress({ step: 'channel.join.done', channelId });
	return results;
}

async function updateAnchorPeers(workspace, userId, config, opts = {}) {
	const { generateAnchorPeerUpdateTx } = require('./configtxgen');
	const channelId = getChannelId(config);
	const progress = typeof opts.progress === 'function' ? opts.progress : null;
	const ordererHost = getPrimaryOrdererLabel();
	const ordererCa = getOrdererTlsRootCertPath();
	const results = [];

	logger.info(`[INFO] Updating anchor peers for ${channelId} in ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.anchor.start', channelId });

	for (const org of (config.orgs || [])) {
		const anchorTxPath = await generateAnchorPeerUpdateTx(workspace, config, org);
		await assertFileExists(anchorTxPath, 'Anchor peer update transaction not found');

		const script = [
			`export ORDERER_CA=${shellQuote(ordererCa)}`,
			`export CORE_PEER_LOCALMSPID=${shellQuote(org.mspId)}`,
			`export CORE_PEER_MSPCONFIGPATH=${shellQuote(getPeerMspPath(org))}`,
			`export CORE_PEER_TLS_ENABLED=true`,
			`peer channel update -o ${shellQuote(`${ordererHost}:7050`)} --ordererTLSHostnameOverride ${shellQuote(ordererHost)} --tls --cafile "$ORDERER_CA" -c ${shellQuote(channelId)} -f ${shellQuote(`/workspace/channel-artifacts/${path.basename(anchorTxPath)}`)}`,
		].join('\n');

		logger.debug('[DEBUG] channel anchor update', { org: org.name, channelId, anchorTxPath });
		const result = await runPeerCommand(workspace, userId, script);
		results.push({ org: org.name, anchorTxPath, stdout: result?.stdout, stderr: result?.stderr });
		if (progress) await progress({ step: 'channel.anchor.org', channelId, org: org.name });
	}

	if (progress) await progress({ step: 'channel.anchor.done', channelId });
	return results;
}

module.exports = { createChannel, joinPeersToChannel, updateAnchorPeers };