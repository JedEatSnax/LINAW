const { exec } = require('child_process')
const { promisify } = require('util')
const logger = require('../utils/logger')
const fabricBinPath = require(`../config/fabric`)
const promisifiedExec = promisify(exec)

const fabricEnv = {
    ...process.env,
    PATH: `${fabricBinPath}:${process.env.PATH}`,
};

// allow async cmd execution 
async function execAsync(cmd, options = {}) {
    const opts = { env: fabricEnv, ...options }
    logger.debug('[DEBUG] execAsync running cmd: ', { cmd, opts })
    try {
        const { stdout, stderr } = await promisifiedExec(cmd, opts)
        if (stderr) {
            logger.debug(`[DEBUG] stderr: ${stderr}`)
        }
        return { stdout, stderr }
    } catch (error) {
        logger.error(`[ERROR] execAsync: ${cmd}\n${error.message}`)
        throw error
    }
}

/* Reference: 
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

async function lsExample() {
  const { stdout, stderr } = await exec('ls');
  console.log('stdout:', stdout);
  console.error('stderr:', stderr);
}
lsExample();

*/
module.exports = { execAsync, fabricEnv } 