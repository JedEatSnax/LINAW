const { execAsync } = require('../../utils/execAsync')
const logger = require('../../utils/logger')

async function composeUp(workspace, userId) {
    logger.info(`[INFO] Starting container for fabric-${userId}...`)
    await execAsync(`docker compose -f docker-compose.yml --project-name fabric-${userId} up -d`, { cwd: workspace })
}


async function composeDown(workspace, userId) {
    logger.info(`[INFO] Stopping container for fabric-${userId}...`)
    // in progress    
    await execAsync(`docker compose -f docker-compose.yml --project-name fabric-${userId} down -d`, { cwd: workspace })
}


async function composeUpCA(workspace, userId, config) {
    logger.info(`[INFO] Starting CA container for fabric-${userId}...`)
    const caServices = [
        `tls-ca-${userId}`,
        `ca-orderer-${userId}`,
        ...config.orgs.map(o => `ca-${o.name}-${userId}`),
    ].join(' ');

    await execAsync(`docker-compose -f docker-compose.yml --project-name fabric-${userId} up -d ${caServices}`, { cwd: workspace });
}

async function composeDownWithVolumes(workspace, userId) {
    logger.info(`[INFO] Destroying container + volumes for fabric-${userId}...`)
    // in progress    
    await execAsync()
}

async function getContainerIds(userId) {

}



module.exports = { composeUp, composeDown, composeUpCA, composeDownWithVolumes }
