'use strict';

function required(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

const fabricConfig = {
    msp_id: required('FABRIC_MSP_ID'),
    channel_name: required('FABRIC_CHANNEL_NAME'),
    chaincode_name: required('FABRIC_CHAINCODE_NAME'),

    peer_endpoint: required('FABRIC_PEER_ENDPOINT'),
    peer_host_alias: required('FABRIC_PEER_HOST_ALIAS'),

    crypto_path: process.env.FABRIC_CRYPTO_PATH || null,
    cert_path: required('FABRIC_CERT_PATH'),
    key_directory_path: required('FABRIC_KEY_DIRECTORY_PATH'),
    tls_cert_path: required('FABRIC_TLS_CERT_PATH'),
};

module.exports = Object.freeze(fabricConfig);


/*
File that handles the environment variables, paths, ports, and hosts
related to the local Hyperledger Fabric blockchain network.
*/
