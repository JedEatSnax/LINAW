const { runCommand } = require('../../orchestration/commandRunner')
const networkOrchestrator = require('../../orchestration/networkOrchestrator')

class networkProvisioningService {
    async testEcho ({ user_id }) {
        // later this will be provision(), but for now just a safe test

        const message = `provision test for user=${user_id || 'unknown'}`
        const result = await runCommand({
            command: 'echo',
            args: [`hello from backend user ${user_id}`],
            cwd: process.cwd(),
        })

        return  {
            message,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode
        }
    }

    async provisionNetwork ({user_id, config}){
        const { config: finalConfig, endpoints, workspace, network_id} =
            await networkOrchestrator.provision(user_id, config)
        
        return {
            network_id,
            workspace,
            endpoints,
            config: finalConfig
        }
    }
}


module.exports = new networkProvisioningService();

/*
    take note the networkOrchestrator runs everything literally a god file instead of provisioning just the 
    network it did basically everything instead of a series of steps.

    for now I whatever progress I have made in the fabric network is my limit.

    I test the networkOrchestrator by commenting out the auth layer in fabric route and making 
    the service layer for that self validated and a fake user.

    I tested it in postman with raw json body

    {
  "config": {
    "name": "test-network",
    "orgs": [
      {
        "name": "Org1",
        "msp_ID": "Org1MSP1",
        "peerCount": 2
      }
    ],
    "consensus": "etcdraft",
    "channelPolicy": "MAJORITY",
    "channelId": "mychannel",
    "stateDb": "couchdb",
    "ordererCount": 1
  }
}

    to test type in cmd

    cd LINAW/backend && npm run dev

    then go to postman and input the post endpoint.

    select the raw body

    paste the raw json body and send.

    it won't fully work but as far as I know it will create .workspaces if not the you have to create in the root 
    of the repo .workspaces to make it work.


    take note also...

    you gotta fake a user to do this if you can't have an authentication which is the firebase_uid
*/