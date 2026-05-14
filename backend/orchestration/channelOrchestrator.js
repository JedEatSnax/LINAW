const fs = require('fs-extra');
const path = require('path');
const { execAsync } = require('../utils/execAsync');
const logger = require('../utils/logger');

function getFabricToolsImage() {
	const fabricVersion = process.env.FABRIC_VERSION || '2.5';
	return `hyperledger/fabric-tools:${fabricVersion}`;
}

function getProjectNetwork(userId) {
	const project = `fabric-${userId}`;
	return `${project}_${project}`;
}

function shellQuote(value) {
	return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function getChannelId(config) {
	return (config && config.channelId) ? config.channelId : 'mainchannel';
}

function getPrimaryOrdererHost(userId) {
	return `orderer-${userId}`;
}

function getChannelArtifactsDir(workspace) {
	return path.join(workspace, 'channel-artifacts');
}

function getPeerMspPath(org) {
	return `/workspace/crypto-config/${org.name}/users/Admin@${org.name}/msp`;
}

function getPeerTlsRootCertDir(org, peerIndex) {
	return `/workspace/crypto-config/${org.name}/peers/peer${peerIndex}/tls`;
}

function getOrdererTlsRootCertDir() {
	return '/workspace/crypto-config/ordererOrg/orderers/orderer/tls';
}

async function assertFileExists(filePath, hint) {
	const exists = await fs.pathExists(filePath);
	if (!exists) {
		throw new Error(`${hint || 'Required file missing'}: ${filePath}`);
	}
}

async function getContainerIp(containerName) {
	try {
		const { stdout } = await execAsync(
			`docker inspect --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ${containerName}`
		);
		const ip = stdout?.trim();
		if (ip) return ip;
	} catch (err) {
		logger.warn(`[WARN] Could not inspect container ${containerName} for IP: ${err.message}`);
	}
	return null;
}

async function runPeerCommand(workspace, userId, script) {
	const img = getFabricToolsImage();
	const network = getProjectNetwork(userId);
	const ordererName = `orderer-${userId}`;
	
	// Build docker run command with orderer IP mapping for DNS resolution
	const cmdParts = [
		'docker run --rm',
		`--network ${network}`,
	];
	
	// Add explicit --add-host mapping for orderer to resolve DNS in transient container
	const ordererIp = await getContainerIp(ordererName);
	if (ordererIp) {
		cmdParts.push(`--add-host ${ordererName}:${ordererIp}`);
		logger.debug(`[DEBUG] Added host mapping: ${ordererName}:${ordererIp}`);
	} else {
		logger.warn(`[WARN] Orderer container IP could not be determined; DNS resolution may fail`);
	}
	
	cmdParts.push(
		`-v "${workspace}:/workspace"`,
		'--workdir /workspace',
		img,
		'bash -lc',
		shellQuote(`set -euo pipefail\n${script}`)
	);
	
	const cmd = cmdParts.join(' ');
	return execAsync(cmd);
}

async function createChannel(workspace, userId, config, opts = {}) {
	const channelId = getChannelId(config);
	const progress = typeof opts.progress === 'function' ? opts.progress : null;
	const channelTxPath = path.join(getChannelArtifactsDir(workspace), `${channelId}.tx`);
	const ordererHost = getPrimaryOrdererHost(userId);
	const ordererTlsDir = getOrdererTlsRootCertDir();

	await assertFileExists(channelTxPath, 'Channel create transaction not found');

	logger.info(`[INFO] Creating channel ${channelId} for ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.create.start', channelId });
	try {
		const result = await runPeerCommand(
			workspace,
			userId,
			[
				`export ORDERER_CA=$(ls ${ordererTlsDir}/tlscacerts/*.pem ${ordererTlsDir}/cacerts/*.pem 2>/dev/null | head -n1 || true)`,
				'[[ -n "$ORDERER_CA" ]] || { echo "Orderer TLS CA cert not found"; exit 1; }',
				`peer channel create -o ${shellQuote(`${ordererHost}:7050`)} --ordererTLSHostnameOverride ${shellQuote(ordererHost)} --tls --cafile "$ORDERER_CA" -c ${shellQuote(channelId)} -f ${shellQuote(`/workspace/channel-artifacts/${channelId}.tx`)}`,
			].join('\n')
		);

		if (progress) await progress({ step: 'channel.create.done', channelId });
		return { channelId, orderer: ordererHost, stdout: result?.stdout, stderr: result?.stderr };
	} catch (err) {
		try {
			const logDir = getChannelArtifactsDir(workspace);
			const logPath = path.join(logDir, `${channelId}.create.error.log`);
			const payload = {
				ts: new Date().toISOString(),
				message: String(err && err.message ? err.message : err),
				stack: err && err.stack ? err.stack : undefined,
				stdout: err && err.stdout ? err.stdout : undefined,
				stderr: err && err.stderr ? err.stderr : undefined,
			};
			// Add diagnostic info: container IPs and simple `docker ps` snippets
			try {
				const ordererName = `orderer-${userId}`;
				const tlsCaName = `tls-ca-${userId}`;
				const ordererIp = await getContainerIp(ordererName);
				const tlsCaIp = await getContainerIp(tlsCaName);
				payload.orderer = { name: ordererName, ip: ordererIp };
				payload.tlsCa = { name: tlsCaName, ip: tlsCaIp };

				try {
					const { stdout: psOrderer } = await execAsync(`docker ps --filter "name=${ordererName}" --format \"{{.ID}} {{.Names}} {{.Status}}\"`);
					payload.orderer.ps = psOrderer && psOrderer.trim();
				} catch (psErr) {
					payload.orderer.ps_error = String(psErr && psErr.message ? psErr.message : psErr);
				}
				try {
					const { stdout: psTls } = await execAsync(`docker ps --filter "name=${tlsCaName}" --format \"{{.ID}} {{.Names}} {{.Status}}\"`);
					payload.tlsCa.ps = psTls && psTls.trim();
				} catch (psErr) {
					payload.tlsCa.ps_error = String(psErr && psErr.message ? psErr.message : psErr);
				}
			} catch (diagErr) {
				// Don't let diagnostics obscure the original error
				payload.diagnostics_error = String(diagErr && diagErr.message ? diagErr.message : diagErr);
			}
			await fs.ensureDir(logDir);
			await fs.writeFile(logPath, JSON.stringify(payload, null, 2));
			logger.error(`[ERROR] Channel create failed; details written to ${logPath}`);
			if (progress) await progress({ step: 'channel.create.failed', channelId, errorLog: logPath });
		} catch (writeErr) {
			logger.error('[ERROR] Failed to write channel create error log: ' + (writeErr && writeErr.message));
		}

		throw err;
	}
}

async function joinPeersToChannel(workspace, userId, config, opts = {}) {
	const channelId = getChannelId(config);
	const progress = typeof opts.progress === 'function' ? opts.progress : null;
	const ordererHost = getPrimaryOrdererHost(userId);
	const ordererTlsDir = getOrdererTlsRootCertDir();
	const results = [];

	logger.info(`[INFO] Joining peers to ${channelId} for ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.join.start', channelId });

	for (const org of (config.orgs || [])) {
		for (let peerIndex = 0; peerIndex < (org.peerCount || 0); peerIndex++) {
			const peerAddress = `peer${peerIndex}.${org.name}:7051`;
			const peerTlsDir = getPeerTlsRootCertDir(org, peerIndex);
			const blockPath = `/workspace/channel-artifacts/${channelId}-${org.name}-peer${peerIndex}.block`;
			const script = [
				`export ORDERER_CA=$(ls ${ordererTlsDir}/tlscacerts/*.pem ${ordererTlsDir}/cacerts/*.pem 2>/dev/null | head -n1 || true)`,
				'[[ -n "$ORDERER_CA" ]] || { echo "Orderer TLS CA cert not found"; exit 1; }',
				`export PEER_TLS_CA=$(ls ${peerTlsDir}/tlscacerts/*.pem ${peerTlsDir}/cacerts/*.pem 2>/dev/null | head -n1 || true)`,
				'[[ -n "$PEER_TLS_CA" ]] || { echo "Peer TLS CA cert not found"; exit 1; }',
				`export CORE_PEER_LOCALMSPID=${shellQuote(org.mspId)}`,
				`export CORE_PEER_MSPCONFIGPATH=${shellQuote(getPeerMspPath(org))}`,
				`export CORE_PEER_TLS_ENABLED=true`,
				`export CORE_PEER_ADDRESS=${shellQuote(peerAddress)}`,
				`export CORE_PEER_TLS_ROOTCERT_FILE="$PEER_TLS_CA"`,
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
	const ordererHost = getPrimaryOrdererHost(userId);
	const ordererTlsDir = getOrdererTlsRootCertDir();
	const results = [];

	logger.info(`[INFO] Updating anchor peers for ${channelId} in ${getProjectNetwork(userId)}...`);
	if (progress) await progress({ step: 'channel.anchor.start', channelId });

	for (const org of (config.orgs || [])) {
		const anchorTxPath = await generateAnchorPeerUpdateTx(workspace, config, org);
		await assertFileExists(anchorTxPath, 'Anchor peer update transaction not found');

		const script = [
			`export ORDERER_CA=$(ls ${ordererTlsDir}/tlscacerts/*.pem ${ordererTlsDir}/cacerts/*.pem 2>/dev/null | head -n1 || true)`,
			'[[ -n "$ORDERER_CA" ]] || { echo "Orderer TLS CA cert not found"; exit 1; }',
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