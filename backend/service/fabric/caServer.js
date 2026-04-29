const logger = require('../../utils/logger')

/*
NOTE:
this file handles the fabric-ca-server cmds
*/

// Poll a CA's /cainfo endpoint until it responds
function pingCA(host, port) {
    // In progress :((
}

async function waitForCA(host, port, retries = 30, interval = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pingCA(host, port);
            logger.debug(`CA ready at ${host}:${port}`);
            return;
        } catch {
            logger.debug(`Waiting for CA at ${host}:${port} (attempt ${i + 1}/${retries})`);
            await new Promise(r => setTimeout(r, interval));
        }
    }
    throw new Error(`CA at ${host}:${port} never became ready after ${retries} attempts`);
}

async function waitForAllCAs(config) {
    const checks = [
        waitForCA('localhost', config.tlsCaPort),
        waitForCA('localhost', config.ordererCaPort),
        ...config.orgs.map(org => waitForCA('localhost', org.caPort)),
    ];
    await Promise.all(checks);
    logger.info('All CA servers are healthy');
}

module.exports = { waitForCA, waitForAllCAs };
