'use strict';

const fs = require ('fs');
const path = require ('path');
const crypto = require('crypto');
const fabricConfig = require('./fabricConfig');
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');

const MSP_ID = fabricConfig.msp_id;
const CHANNEL_NAME = fabricConfig.channel_name;
const CHAINCODE_NAME = fabricConfig.chaincode_name;
const KEY_DIRECTORY_PATH = fabricConfig.key_directory_path;
const CERT_PATH = fabricConfig.cert_path;
const TLS_CERT_PATH = fabricConfig.tls_cert_path;
const PEER_ENDPOINT = fabricConfig.peer_endpoint;
const PEER_HOST_ALIAS = fabricConfig.peer_host_alias;

let gatwaInstance = null
let clietnInstance = null
let networkInstance = null
let contractInstance = null

function newGrpcConnection() {
  const tlsRootCert = fs.readFileSync(TLS_CERT_PATH);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(PEER_ENDPOINT, tlsCredentials, {
    'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
  });
}

function newIdentity () {
    const credentials = fs.readFileSync(CERT_PATH)

    return {
        mspId: MSP_ID,
        credentials
    }
}

function newSigner() {
    const files = fs.readDirSync(KEY_DIRECTORY_PATH)

    if (!files.length) {
        throw new Error('No private key found in FABRIC_KEY_DIRECTORY_PATH')
    }

    const privateKeyPath = path.join(KEY_DIRECTORY_PATH, file[0])
    const privateKeyPem = fs.readFileSync(privateKeyPath)
    const privateKey = crypto.createPrivateKey(privateKeyPem)
    
    return signers.newPrivateKeySigner(privateKey)
}

function intGateway () {
    if (contractInstance) {
        return {
            gateway: gatwaInstance,
            client: clietnInstance,
            network: networkInstance,
            contract: contractInstance
        }
    }

    clietnInstance = newGrpcConnection()
    
    gatwaInstance = connect ({
        client: clietnInstance,
        identity: newIdentity(),
        signer: newSigner(),
        hash: hash.sha256,

        // timeout for different grpc calls
        evaluationOption: () => {
            return { deadline: Date.now() + 5000}
        },
        endorseOption: () => {
            return { deadline: Date.now() + 1500}
        },
        submitOption: () => {
            return { deadline: Date.now() + 5000}
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000}
        }

    })

    networkInstance = gatwaInstance.getNetwork(CHANNEL_NAME)
    contractInstance = networkInstance.getContract(CHAINCODE_NAME)


    return {
        gateway: gatewayInstance,
        client: clietnInstance,
        network: networkInstance,
        contract: contractInstance
    }
}

function getContract () {
  if (!contractInstance) {
    initGateway();
  }

  return contractInstance;
}

function closeGateway () {
    if (gatewayInstance) {
        gatewayInstance.close()
        gatewayInstance = null
    }

    if (clietnInstance) {
        clietnInstance.close()
        clietnInstance = null
    }

    networkInstance = null
    contractInstance = null
}

module.exports = {
  initGateway,
  getContract,
  closeGateway,
};


/*
File that handles gRPC connection and Hyperledger Fabric gateway
*/