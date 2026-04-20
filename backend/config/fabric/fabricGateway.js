const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const grpc = require("@grpc/grpc-js");
const { connect, hash, signers } = require("@hyperledger/fabric-gateway");

function getValidatedFabricConfig() {
  const fabricConfig = {
    msp_id: process.env.FABRIC_MSP_ID,
    channel_name: process.env.FABRIC_CHANNEL_NAME,
    chaincode_name: process.env.FABRIC_CHAINCODE_NAME,
    key_directory_path: process.env.FABRIC_KEY_DIRECTORY_PATH,
    cert_path: process.env.FABRIC_CERT_PATH,
    tls_cert_path: process.env.FABRIC_TLS_CERT_PATH,
    peer_endpoint: process.env.FABRIC_PEER_ENDPOINT,
    peer_host_alias: process.env.FABRIC_PEER_HOST_ALIAS,
  };

  const requiredEnvMap = {
    msp_id: "FABRIC_MSP_ID",
    channel_name: "FABRIC_CHANNEL_NAME",
    chaincode_name: "FABRIC_CHAINCODE_NAME",
    key_directory_path: "FABRIC_KEY_DIRECTORY_PATH",
    cert_path: "FABRIC_CERT_PATH",
    tls_cert_path: "FABRIC_TLS_CERT_PATH",
    peer_endpoint: "FABRIC_PEER_ENDPOINT",
    peer_host_alias: "FABRIC_PEER_HOST_ALIAS",
  };

  const missingVars = Object.entries(requiredEnvMap)
    .filter(([key]) => !fabricConfig[key])
    .map(([, envName]) => envName);

  if (missingVars.length) {
    throw new Error(
      `Fabric gateway is not configured. Missing environment variables: ${missingVars.join(", ")}`,
    );
  }

  return fabricConfig;
}

let gatewayInstance = null;
let clientInstance = null;
let networkInstance = null;
let contractInstance = null;

function newGrpcConnection(fabricConfig) {
  const tlsRootCert = fs.readFileSync(fabricConfig.tls_cert_path);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(fabricConfig.peer_endpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": fabricConfig.peer_host_alias,
  });
}

function newIdentity(fabricConfig) {
  const credentials = fs.readFileSync(fabricConfig.cert_path);

  return {
    mspId: fabricConfig.msp_id,
    credentials,
  };
}

function newSigner(fabricConfig) {
  const files = fs.readdirSync(fabricConfig.key_directory_path);

  if (!files.length) {
    throw new Error("No private key found in FABRIC_KEY_DIRECTORY_PATH");
  }

  const privateKeyPath = path.join(fabricConfig.key_directory_path, files[0]);
  const privateKeyPem = fs.readFileSync(privateKeyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);

  return signers.newPrivateKeySigner(privateKey);
}

function initGateway() {
  if (contractInstance) {
    return {
      gateway: gatewayInstance,
      client: clientInstance,
      network: networkInstance,
      contract: contractInstance,
    };
  }

  const fabricConfig = getValidatedFabricConfig();

  clientInstance = newGrpcConnection(fabricConfig);

  gatewayInstance = connect({
    client: clientInstance,
    identity: newIdentity(fabricConfig),
    signer: newSigner(fabricConfig),
    hash: hash.sha256,

    // timeout for different grpc calls
    evaluationOption: () => {
      return { deadline: Date.now() + 5000 };
    },
    endorseOption: () => {
      return { deadline: Date.now() + 1500 };
    },
    submitOption: () => {
      return { deadline: Date.now() + 5000 };
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 };
    },
  });

  networkInstance = gatewayInstance.getNetwork(fabricConfig.channel_name);
  contractInstance = networkInstance.getContract(fabricConfig.chaincode_name);

  return {
    gateway: gatewayInstance,
    client: clientInstance,
    network: networkInstance,
    contract: contractInstance,
  };
}

function getContract() {
  if (!contractInstance) {
    initGateway();
  }

  return contractInstance;
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
  contractInstance = null;
}

module.exports = {
  initGateway,
  getContract,
  closeGateway,
};
