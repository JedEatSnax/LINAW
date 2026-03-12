const { exec, spawn } = require("node:child_process")
const util = require('util');
const execAsync = util.promisify(exec);
const fabric_ca_client = './fabric-samples/bin/fabric-ca-client'

/*
should've used binaries instead for network creation so imma rewrite everything.
I'm so dumdum and it's still work in progress :((

Note: What I know of the flow in creating network using binaries:
- create docker compose fabric-ca-server container (fabric-ca-server init -b admin:adminpw)
- docker compose up fabric-ca-server-config.yaml
- connect client to server with TLS stuff?? (need more research)
- generate channel artifact, start orderer/peer, create channel, join peers and anchor peers.

after that you get a basic network yipeee. the params on createNetwork is only temporary since 
I'm testing how can a client input their own customized names and all. Also need to learn how
the certificate works in great detail and how docker compose work also in great detail
*/

class networkManager {
  async createNetwork(network_name, org_name, admin, adminpw, localhost, caname) {
    try {  
      
      // get current directory for PWD reference
      const pwdResult = await execAsync('pwd');
      const currentDir = pwdResult.stdout.trim();
      
      console.log(`Creating network: ${network_name} for org: ${org_name}`);

      // fabric-ca-client getcainfo 
      await execAsync(
        `${fabric_ca_client} getcainfo ` +
        `-u https://${admin}:${adminpw}@localhost:${localhost} ` +
        `--caname ${caname} ` +
        `--tls.certfiles "${currentDir}/ca-cert.pem"`
      );
      console.log("CA info retrieved");

      // generate crypto materials
      await execAsync(
        `${fabric_ca_client} enroll -u https://${admin}:${adminpw}@localhost:${localhost} ` +
        `--caname ${caname} -M ./organizations/${org_name}`
      );
      console.log("Crypto materials generated");

      // Generate channel artifacts, start orderer/peer, create channel, etc.

      return { name: network_name, org: org_name, status: 'created' };
      
    } catch (error) {
      console.error('Network creation failed:', error.message);
      throw error;
    }
  }
}

module.exports = new networkManager()

/*
Note: these are references when reading the fabric-sample network.sh up

: ${CONTAINER_CLI:="docker compose"}

# use this as the default docker-compose yaml definition
COMPOSE_FILE_BASE=compose-test-net.yaml

# docker-compose.yaml file if you are using couchdb
COMPOSE_FILE_COUCH=compose-couch.yaml

# certificate authorities compose file
COMPOSE_FILE_CA=compose-ca.yaml

# use this as the default docker-compose yaml definition for org3
COMPOSE_FILE_ORG3_BASE=compose-org3.yaml

# use this as the docker compose couch file for org3
COMPOSE_FILE_ORG3_COUCH=compose-couch-org3.yaml

# certificate authorities compose file
COMPOSE_FILE_ORG3_CA=compose-ca-org3.yaml


# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

*/
