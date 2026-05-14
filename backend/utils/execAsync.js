const { execFile } = require('child_process')
const { promisify } = require('util')
const logger = require('../utils/logger')
const fabricBinPath = require(`../config/fabric/fabricConfig`)
const promisifiedExec = promisify(exec)

const fabricEnv = {
  ...process.env,
  PATH: `${fabricBinPath}:${process.env.PATH}`,
};

// allow async cmd execution 
async function execAsync(file, options = {}) {
    const opts = { env: fabricEnv, ...options }
    logger.debug('[DEBUG] execAsync running file', {
         file,
         hasOptions: Object.keys(options).length > 0,
         hasEnv: Boolean(opts.env),
         cwd: opts.cwd,
         timeout: opts.timeout
     })
    try {
        const { stdout, stderr } = await promisifiedExec(file, opts)
        if (stderr) {
            logger.debug(`[DEBUG] stderr: ${stderr}`)
        }
        return { stdout, stderr }
    } catch (error) {
        logger.error(`[ERROR] execAsync: ${file}\n${error.message}`)
        throw error
    }
}

async function waitForTlsCaReady(userId, tlsCaPort, timeoutMs = 60000) {
  const project = `fabric-${userId}`;
  const network = `${project}_${project}`; // same as runFabricCaClient
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      // Use a tiny curl container on the same Docker network to hit /cainfo
      await execAsync(
        [
          'docker run --rm',
          `--network ${network}`,
          '--entrypoint curl',
          'curlimages/curl:8.7.1',
          `-sk https://localhost:${tlsCaPort}/cainfo`
        ].join(' ')
      );
      return; // success: TLS CA responded
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000)); // wait 2s and retry
    }
  }

  throw new Error(`TLS-CA did not become healthy on port ${tlsCaPort} for user ${userId}`);
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
