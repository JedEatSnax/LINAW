const nodeVault = require('node-vault');
const logger = require('../utils/logger');


let _client = null;

function getClient() {
    if (!_client) {
        _client = nodeVault({
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR,
            token: process.env.VAULT_TOKEN,
        });
    }
    return _client;
}


// write a secret to Vault KV v2
async function writeSecret(secretPath, data) {
    logger.debug(`[DEBUG] Vault: writing secret at fabric/${secretPath}`);
    await getClient().write(`fabric/data/${secretPath}`, { data });
}

// read a secret from Vault KV v2
async function readSecret(secretPath) {
    try {
        logger.debug(`[DEBUG] Vault: reading secret at fabric/${secretPath}`);
        const response = await getClient().read(`fabric/data/${secretPath}`);
        return response?.data?.data || null;
    } catch (err) {
        if (err.response?.statusCode === 404) return null;
        throw err;
    }
}

// delete all versions of a secret
async function deleteSecret(secretPath) {
    logger.debug(`[DEBUG] Vault: deleting secret at fabric/${secretPath}`);
    await getClient().delete(`fabric/metadata/${secretPath}`);
}

// list secret keys under a path prefix
async function listSecrets(prefix) {
    try {
        const response = await getClient().list(`fabric/metadata/${prefix}`);
        return response?.data?.keys || [];
    } catch (err) {
        if (err.response?.statusCode === 404) return [];
        throw err;
    }
}

// delete all secrets under a network prefix (used for destroying network)
async function deleteNetworkSecrets(networkId) {
    logger.info(`[INFO] Vault: deleting all secrets for network ${networkId}`);
    const prefix = `networks/${networkId}`;
    const keys = await listSecrets(prefix);

    for (const key of keys) {
        await deleteSecret(`${prefix}/${key}`);
    }
}

// I dunno if I should add undelete so imma put an empty stuff for now
async function undeleteSecret() {

}


// check health status of vault
async function checkVaultHealth() {
    try {
        const health = await getClient().health();
        logger.info(`[INFO] Vault is available (version: ${health.version})`);
    } catch (err) {
        throw new Error(`Vault not available: ${err.message}`);
    }
}

module.exports = {
    writeSecret,
    readSecret,
    deleteSecret,
    listSecrets,
    deleteNetworkSecrets,
    checkVaultHealth,
};

/*
References for me bad memory lol

https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2


// init vault server
vault.init({ secret_shares: 1, secret_threshold: 1 })
  .then((result) => {
    const keys = result.keys;
    // set token for all following requests
    vault.token = result.root_token;
    // unseal vault server
    return vault.unseal({ secret_shares: 1, key: keys[0] });
  })
  .catch(console.error);

// write
vault.write('secret/hello', { value: 'world', lease: '1s' })
  .then(() => vault.read('secret/hello'))
  .then(() => vault.delete('secret/hello'))
  .catch(console.error);

// update
vault.update('secret/data/hello', { data: { value: 'new-world' } })
  .catch(console.error);

// list
vault.list('secret/metadata/')
  .then((result) => console.log(result.data.keys))
  .catch(console.error);

// health


*/