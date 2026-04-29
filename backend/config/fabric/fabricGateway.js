'use strict';

const fs = require('fs');
const path = require('path');
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

let gatewayInstance = null;
let clientInstance = null;
let networkInstance = null;

function newGrpcConnection() {
  const tlsRootCert = fs.readFileSync(TLS_CERT_PATH);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(PEER_ENDPOINT, tlsCredentials, {
    'grpc.ssl_target_name_override': PEER_HOST_ALIAS,
  });
}

function newIdentity() {
  const credentials = fs.readFileSync(CERT_PATH);

  return {
    mspId: MSP_ID,
    credentials,
  };
}

function newSigner() {
  const files = fs.readdirSync(KEY_DIRECTORY_PATH);

  if (!files.length) {
    throw new Error('No private key found in FABRIC_KEY_DIRECTORY_PATH');
  }

  const privateKeyPath = path.join(KEY_DIRECTORY_PATH, files[0]);
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

  networkInstance = gatewayInstance.getNetwork(CHANNEL_NAME);

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

  return networkInstance.getContract(CHAINCODE_NAME, contractName);
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