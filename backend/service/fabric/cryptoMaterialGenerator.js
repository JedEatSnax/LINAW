const path = require('path');
const fs = require('fs-extra');
const { enrollCAAdmin, register, enroll, enrollTLS } = require('./caClient');
const { waitForAllCAs } = require('./caServer');
const logger = require('../utils/logger');

/*
NOTE:
    still hardcoded id and password
    imma try it hardcoded for now just to simplify things
*/

async function generateAllCryptoMaterial(workspace, config) {
    await waitForAllCAs(config);

    const tlsCaUrl = `localhost:${config.tlsCaPort}`;
    const tlsCAHome = `${workspace}/crypto-config/tls-ca`;
    const tlsCaCert = `${tlsCAHome}/tls-cert.pem`;

    // TLS CA bootstrap
    logger.info('[INFO] Enrolling TLS CA admin');
    await enrollCAAdmin(tlsCaUrl, 'tls-admin', 'tls-adminpw', tlsCAHome, tlsCaCert);

    // Orderer CA bootstrap 
    const ordCaUrl = `localhost:${config.ordererCaPort}`;
    const ordCAHome = `${workspace}/crypto-config/ordererOrg/ca`;
    const ordCaCert = `${ordCAHome}/tls-cert.pem`;

    logger.info('[INFO] Enrolling Orderer CA admin');
    await enrollCAAdmin(ordCaUrl, 'ordereradmin', 'ordereradminpw', ordCAHome, ordCaCert);

    // Register + enroll orderer MSP identity
    await register(ordCaUrl, 'ca-orderer', 'orderer', 'ordererpw', 'orderer', 'org1.department1', ordCAHome, ordCaCert);
    const ordMSPDir = `${workspace}/crypto-config/ordererOrg/orderers/orderer/msp`;
    await enroll(ordCaUrl, 'ca-orderer', 'orderer', 'ordererpw', ordMSPDir, ordCaCert);

    // Register + enroll orderer TLS identity
    await register(tlsCaUrl, 'tls-ca', 'orderer', 'ordererpw', 'orderer', 'org1.department1', tlsCAHome, tlsCaCert);
    const ordTLSDir = `${workspace}/crypto-config/ordererOrg/orderers/orderer/tls`;
    await enrollTLS(tlsCaUrl, 'orderer', 'ordererpw', ordTLSDir, tlsCaCert, ['orderer', 'localhost']);

    // Orderer admin user
    await register(ordCaUrl, 'ca-orderer', 'ordererAdmin', 'ordererAdminpw', 'admin', 'org1.department1', ordCAHome, ordCaCert);
    const ordAdminMSPDir = `${workspace}/crypto-config/ordererOrg/users/Admin/msp`;
    await enroll(ordCaUrl, 'ca-orderer', 'ordererAdmin', 'ordererAdminpw', ordAdminMSPDir, ordCaCert);

    // Build orderer org MSP (used by configtxgen)
    await buildOrgMSP(`${workspace}/crypto-config/ordererOrg/msp`, ordCaCert, tlsCaCert);

    // Per-org enrollment 
    for (const org of config.orgs) {
        const orgCaUrl = `localhost:${org.caPort}`;
        const orgCAHome = `${workspace}/crypto-config/${org.name}/ca`;
        const orgCaCert = `${orgCAHome}/tls-cert.pem`;

        logger.info(`[INFO] Enrolling CA admin for org ${org.name}...`);
        await enrollCAAdmin(orgCaUrl, `${org.name}admin`, `${org.name}adminpw`, orgCAHome, orgCaCert);

        for (let i = 0; i < org.peerCount; i++) {
            const peerId = `peer${i}.${org.name}`;
            const peerSecret = `peer${i}${org.name}pw`;

            // MSP identity
            await register(orgCaUrl, `ca-${org.name}`, peerId, peerSecret, 'peer', `${org.name}.department1`, orgCAHome, orgCaCert);
            const peerMSPDir = `${workspace}/crypto-config/${org.name}/peers/peer${i}/msp`;
            await enroll(orgCaUrl, `ca-${org.name}`, peerId, peerSecret, peerMSPDir, orgCaCert);

            // TLS identity
            await register(tlsCaUrl, 'tls-ca', peerId, peerSecret, 'peer', `${org.name}.department1`, tlsCAHome, tlsCaCert);
            const peerTLSDir = `${workspace}/crypto-config/${org.name}/peers/peer${i}/tls`;
            await enrollTLS(tlsCaUrl, peerId, peerSecret, peerTLSDir, tlsCaCert, [peerId, `peer${i}.${org.name}`, 'localhost']);

            logger.info(`[INFO] Enrolled peer${i} for org ${org.name}`);
        }

        // Org admin user
        await register(orgCaUrl, `ca-${org.name}`, `${org.name}Admin`, `${org.name}Adminpw`, 'admin', `${org.name}.department1`, orgCAHome, orgCaCert);
        const adminMSPDir = `${workspace}/crypto-config/${org.name}/users/Admin/msp`;
        await enroll(orgCaUrl, `ca-${org.name}`, `${org.name}Admin`, `${org.name}Adminpw`, adminMSPDir, orgCaCert);

        // Build org MSP (used by configtxgen)
        await buildOrgMSP(`${workspace}/crypto-config/${org.name}/msp`, orgCaCert, tlsCaCert);
    }

    logger.info('[INFO] All crypto material generated via Fabric CA');
}

// Build the org-level MSP directory that configtxgen reads
async function buildOrgMSP(mspDir, caCert, tlsCaCert) {
    await fs.ensureDir(`${mspDir}/cacerts`);
    await fs.ensureDir(`${mspDir}/tlscacerts`);
    await fs.copy(caCert, `${mspDir}/cacerts/ca-cert.pem`);
    await fs.copy(tlsCaCert, `${mspDir}/tlscacerts/tls-cert.pem`);
}

module.exports = { generateAllCryptoMaterial };
