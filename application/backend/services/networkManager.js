const { exec, spawn } = require("node:child_process")
const util = require('util');
const execAsync = util.promisify(exec);
const fabric_ca_client = './fabric-samples/bin/fabric-ca-client'

// should've used binaries instead for network creation. I'm so dumdum

class networkManager {
  async createNetwork(network_name, org_name, admin, adminpw, localhost, caname) {
        try {
      // Get current directory for PWD reference
      const pwdResult = await execAsync('pwd');
      const currentDir = pwdResult.stdout.trim();
      
      console.log(`Creating network: ${network_name} for org: ${org_name}`);

      // 2. fabric-ca-client getcainfo 
      await execAsync(
        `${fabric_ca_client} getcainfo ` +
        `-u https://${admin}:${adminpw}@localhost:${localhost} ` +
        `--caname ${caname} ` +
        `--tls.certfiles "${currentDir}/ca-cert.pem"`
      );
      console.log("CA info retrieved");

      // 3. Generate crypto materials (admin, users, etc.)
      await execAsync(
        `${fabric_ca_client} enroll -u https://${admin}:${adminpw}@localhost:${localhost} ` +
        `--caname ${caname} -M ./organizations/${org_name}`
      );
      console.log("Crypto materials generated");

      // 4. Generate channel artifacts, start orderer/peer, create channel, etc.
      // Add more sequential steps here...

      return { name: network_name, org: org_name, status: 'created' };
      
    } catch (error) {
      console.error('Network creation failed:', error.message);
      throw error;
    }
  }
    
    // check input first (implement later)
    
    // create docker compose fabric-ca-server container (fabric-ca-server init -b admin:adminpw)
    // docker compose up fabric-ca-server-config.yaml

    // create crypto material using Fabric CA. Create admin, orgs, orderer, ccp (connection configuration profile)
    // fabric-ca-client getcainfo -u https://admin:adminpw@localhost:7054 --caname ca-org1 --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"
  //   spawn(fabric_ca_client, [
  //     `getcainfo`,
  //     `-u`, `https://${admin}:${adminpw}@localhost:${localhost}`,
  //     `--caname`, `${caname}`,
  //     `--tls.certfiles`, '"${pwd}/ca-cert.pem"'],
  //     {stdio: `inherit`})
    
  //   // generate channel artifact
  //   // start Orderer
  //   // start peer
  //   // create channel
  //   // join peers to channel
  //   // set anchor peerS
  //   // 
  //   return {name: network_name, org: org_name}
  // }
}

module.exports = new networkManager()

// : ${CONTAINER_CLI:="docker compose"}

// # use this as the default docker-compose yaml definition
// COMPOSE_FILE_BASE=compose-test-net.yaml

// # docker-compose.yaml file if you are using couchdb
// COMPOSE_FILE_COUCH=compose-couch.yaml

// # certificate authorities compose file
// COMPOSE_FILE_CA=compose-ca.yaml

// # use this as the default docker-compose yaml definition for org3
// COMPOSE_FILE_ORG3_BASE=compose-org3.yaml

// # use this as the docker compose couch file for org3
// COMPOSE_FILE_ORG3_COUCH=compose-couch-org3.yaml

// # certificate authorities compose file
// COMPOSE_FILE_ORG3_CA=compose-ca-org3.yaml


// # Get docker sock path from environment variable
// SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
// DOCKER_SOCK="${SOCK##unix://}"








// exports.networkManager = {
//   async createNetwork(networkName, orgName) {
//     return { name: networkName, org: orgName };
//   }
// };




// // for now testing local creation of network :((
// // NOTE: still not working

// const Docker = require('dockerode');
// const fs = require('fs').promises;
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const yaml = require('js-yaml');

// const networks = new Map();

// class networkManager {
//   constructor() {
//     this.docker = new Docker();
//   }

//   async createNetwork(networkName, orgName) {
//     const networkId = uuidv4();
    
//     // only used for local testing
//     const configDir = path.join(process.cwd(), `networks/${networkId}`);
//     await fs.mkdir(configDir, { recursive: true });
    
//     // generate config still not finished
//     await this.generateConfigs(orgName.toLowerCase(), configDir);
    
//     const composePath = path.join(configDir, 'docker-compose.yaml');
//     await this.startDockerCompose(composePath);
    
//     const networkInfo = {
//       id: networkId,
//       name: networkName,
//       org: orgName,
//       createdAt: new Date().toISOString()
//     };
    
//     networks.set(networkId, networkInfo);
    
//     networkInfo.status = 'ready';
//     return networkInfo;
//   }

//   async generateConfigs(orgName, configDir) {
//     // generate crypto material via cryptogen / Fabric CA


//     // generate certificate
//     // generate orderer
    

//   }

//   // bring up network
//   async startDockerCompose(composePath) {
//     return new Promise((resolve, reject) => {
//       require('child_process').exec(`docker compose -f ${composePath} up -d`, (err) => {
//         if (err) reject(err); else resolve();
//       });
//     });
//   }

//   // fabric gateway stuff
  
// }

// module.exports = new networkManager();