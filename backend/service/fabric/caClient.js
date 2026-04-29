const logger = require('../../utils/logger');
const { execAsync, fabricEnv } = require('../../utils/execAsync')
/*
NOTE:
this file basically handles all fabric-ca-client commands
also I saw that you can do docker exec for cmd execution but i dunno if 
its fine to use since im trying to follow the fabric-samples network.sh flow
*/

function caEnv(caHome) {
    return { ...fabricEnv, FABRIC_CA_CLIENT_HOME: caHome };
}

// Enroll the bootstrap admin of a CA
// This is always the first call against any CA server
async function enrollCAAdmin(caUrl, adminId, adminSecret, caHome, tlsCertPath) {
    await fs.ensureDir(caHome);
    logger.debug(`Enrolling CA admin ${adminId} at ${caUrl}`);
    await execAsync(
        `fabric-ca-client enroll \
      -u https://${adminId}:${adminSecret}@${caUrl} \
      --tls.certfiles ${tlsCertPath} \
      --caname ${adminId.replace('admin', '')}`,
        { env: caEnv(caHome) }
    );
}

// Register a new identity with the CA
// Must be called while authenticated as the CA admin
async function register(caUrl, caName, id, secret, type, affiliation, caHome, tlsCertPath) {
    logger.debug(`Registering identity ${id} (${type}) on ${caName}`);
    await execAsync(
        `fabric-ca-client register \
      --caname ${caName} \
      --id.name ${id} \
      --id.secret ${secret} \
      --id.type ${type} \
      --id.affiliation ${affiliation} \
      --tls.certfiles ${tlsCertPath} \
      -u https://${caUrl}`,
        { env: caEnv(caHome) }
    );
}

// Enroll a registered identity — writes MSP (cert + key) to mspDir
async function enroll(caUrl, caName, id, secret, mspDir, tlsCertPath) {
    await fs.ensureDir(mspDir);
    logger.debug(`Enrolling identity ${id} into ${mspDir}`);
    await execAsync(
        `fabric-ca-client enroll \
      -u https://${id}:${secret}@${caUrl} \
      --caname ${caName} \
      -M ${mspDir} \
      --tls.certfiles ${tlsCertPath}`,
        { env: caEnv(mspDir) }
    );
}

// Enroll TLS identity against the TLS CA (uses --enrollment.profile tls)
async function enrollTLS(tlsCaUrl, id, secret, tlsDir, tlsCaCert, hosts = []) {
    await fs.ensureDir(tlsDir);
    const csrHosts = hosts.length ? `--csr.hosts ${hosts.join(',')}` : '';
    logger.debug(`Enrolling TLS identity ${id} into ${tlsDir}`);
    await execAsync(
        `fabric-ca-client enroll \
      -u https://${id}:${secret}@${tlsCaUrl} \
      --caname tls-ca \
      -M ${tlsDir} \
      --enrollment.profile tls \
      ${csrHosts} \
      --tls.certfiles ${tlsCaCert}`,
        { env: caEnv(tlsDir) }
    );
}

module.exports = {
    enrollCAAdmin,
    register,
    enroll,
    enrollTLS
}
