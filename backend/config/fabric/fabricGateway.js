'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadFabricConfig } = require('./fabricConfig');
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');

let gatewayInstance = null;
let clientInstance = null;
let networkInstance = null;
let fabricConfig = null;

function getFabricConfig() {
  if (!fabricConfig) {
    fabricConfig = loadFabricConfig();
  }

  return fabricConfig;
}

function newGrpcConnection() {
  const { peer_endpoint: peerEndpoint, peer_host_alias: peerHostAlias, tls_cert_path: tlsCertPath } = getFabricConfig();
  const tlsRootCert = fs.readFileSync(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': peerHostAlias,
  });
}

function newIdentity() {
  const { msp_id: mspId, cert_path: certPath } = getFabricConfig();
  const credentials = fs.readFileSync(certPath);

  return {
    mspId,
    credentials,
  };
}

function newSigner() {
  const { key_directory_path: keyDirectoryPath } = getFabricConfig();
  const files = fs.readdirSync(keyDirectoryPath);

  if (!files.length) {
    throw new Error('No private key found in FABRIC_KEY_DIRECTORY_PATH');
  }

  const privateKeyPath = path.join(keyDirectoryPath, files[0]);
  const privateKeyPem = fs.readFileSync(privateKeyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);

  return signers.newPrivateKeySigner(privateKey);
}

function initGateway() {
  if (networkInstance) {
    return {
      gateway: gatewayInstance,
      client: clientInstance,
      network: networkInstance,
    };
  }

  clientInstance = newGrpcConnection();

  gatewayInstance = connect({
    client: clientInstance,
    identity: newIdentity(),
    signer: newSigner(),
    hash: hash.sha256,
    evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 5000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
  });

  const { channel_name: channelName } = getFabricConfig();
  networkInstance = gatewayInstance.getNetwork(channelName);

  return {
    gateway: gatewayInstance,
    client: clientInstance,
    network: networkInstance,
  };
}

function getContract(contractName) {
  if (!networkInstance) {
    initGateway();
  }

  if (!contractName) {
    throw new Error('contractName is required');
  }

  const { chaincode_name: chaincodeName } = getFabricConfig();
  return networkInstance.getContract(chaincodeName, contractName);
}

function closeGateway() {
  if (gatewayInstance) {
    gatewayInstance.close();
    gatewayInstance = null;
  }

  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }

  networkInstance = null;
}

module.exports = {
  initGateway,
  getContract,
  closeGateway,
};