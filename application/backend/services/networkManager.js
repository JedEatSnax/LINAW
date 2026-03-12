// for now testing local creation of network :((
// NOTE: still not working


const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');

const networks = new Map();

class networkManager {
  constructor() {
    this.docker = new Docker();
  }

  async createNetwork(networkName, orgName) {
    const networkId = uuidv4();
    
    // only used for local testing
    const configDir = path.join(process.cwd(), `networks/${networkId}`);
    await fs.mkdir(configDir, { recursive: true });
    
    // generate config still not finished
    await this.generateConfigs(orgName.toLowerCase(), configDir);
    
    const composePath = path.join(configDir, 'docker-compose.yaml');
    await this.startDockerCompose(composePath);
    
    
    const networkInfo = {
      id: networkId,
      name: networkName,
      org: orgName,
      status: 'starting',
      configDir,
      peerPort: 7051 + Math.floor(Math.random() * 1000),
      ordererPort: 7050 + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString()
    };
    
    networks.set(networkId, networkInfo);
    
    networkInfo.status = 'ready';
    return networkInfo;
  }

  async generateConfigs(orgName, configDir) {
    // generate crypto material via cryptogen / Fabric CA


    // generate certificate
    // generate orderer
    

  }

  // bring up network
  async startDockerCompose(composePath) {
    return new Promise((resolve, reject) => {
      require('child_process').exec(`docker compose -f ${composePath} up -d`, (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
}

module.exports = new networkManager();