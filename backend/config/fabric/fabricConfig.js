function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadFabricConfig() {
  return Object.freeze({
    msp_id: required("FABRIC_MSP_ID"),
    channel_name: required("FABRIC_CHANNEL_NAME"),
    chaincode_name: required("FABRIC_CHAINCODE_NAME"),

    peer_endpoint: required("FABRIC_PEER_ENDPOINT"),
    peer_host_alias: required("FABRIC_PEER_HOST_ALIAS"),

    crypto_path: process.env.FABRIC_CRYPTO_PATH || null,
    cert_path: required("FABRIC_CERT_PATH"),
    key_directory_path: required("FABRIC_KEY_DIRECTORY_PATH"),
    tls_cert_path: required("FABRIC_TLS_CERT_PATH"),
  });
}

module.exports = { loadFabricConfig };
