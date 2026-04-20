const { resolve, join } = require("path");

const fabricVersions = Object.freeze({
  FABRIC_VERSION: process.env.FABRIC_VERSION || "2.5.15",
  FABRIC_CA_VERSION: process.env.FABRIC_CA_VERSION || "1.5.17",
  CRYPTOGEN: "Certificate Authorities",
});

// Defaults mirror network.config so the backend can reconstruct network.sh expectations.
const networkDefaults = Object.freeze({
  IMAGETAG: "default",
  CA_IMAGETAG: "default",
  CRYPTO: "cryptogen",
  MAX_RETRY: 5,
  CLI_DELAY: 3,
  CHANNEL_NAME: "mychannel",
  DATABASE: "leveldb",
  ORG: 1,
  CC_SRC_LANGUAGE: "javascript",
  CC_VERSION: "1.0",
  CC_NAME: "basic",
  CCAAS_DOCKER_RUN: true,
  CC_SRC_PATH: "../asset-transfer-basic/chaincode-javascript",
  CC_END_POLICY: "NA",
  CC_COLL_CONFIG: "NA",
  CC_INIT_FCN: "NA",
  CC_SEQUENCE: "auto",
  CC_INVOKE_CONSTRUCTOR: '{"Args":["InitLedger"]}',
  CC_QUERY_CONSTRUCTOR: '{"Args":["GetAllAssets"]}',
});

const fabricCompose = Object.freeze({
  BASE: "compose-test-net.yaml",
  BFT: "~/backend/config/compose/byzantine-fault-tolerant.yml",
  COUCH: "~/backend/config/compose/couch-db.yml",
  CA: "~/backend/config/compose/certificate-authority.yml",
});

const fabricPaths = Object.freeze({
  INSTALL_ROOT: "/usr/local/fabric",
  BIN_DIR: join(INSTALL_ROOT, "bin"),
  CONFIG_DIR: join(INSTALL_ROOT, "config"),
  ORG_DIR: join(INSTALL_ROOT, "organizations"),
  TMP_DIR: "$(mktemp -d)",

  TEST_NETWORK_ROOT: resolve(__dirname, "../../../fabric-samples/test-network"),
  BIN_RELATIVE: join(TEST_NETWORK_ROOT, "../bin"),
  CONFIGTX_DIR: join(TEST_NETWORK_ROOT, "configtx"),
  COMPOSE_DIR: join(TEST_NETWORK_ROOT, "compose"),
  SCRIPTS_DIR: join(TEST_NETWORK_ROOT, "scripts"),
  ORGS_DIR: join(TEST_NETWORK_ROOT, "organizations"),
});

const organizationPaths = Object.freeze({
  PEER_ORG_DIR: join(fabricPaths.ORG_DIR, "peerOrganizations"),
  ORDERER_ORG_DIR: join(fabricPaths.ORG_DIR, "ordererOrganizations"),
  CERT_AUTHORITY_DIR: join(fabricPaths.ORG_DIR, "certificate-authorities"),
  SAMPLE_PEER_ORGS: join(TEST_NETWORK_ROOT, "organizations/peerOrganizations"),
  SAMPLE_ORDERER_ORGS: join(
    TEST_NETWORK_ROOT,
    "organizations/ordererOrganizations",
  ),
});

const dockerSettings = Object.freeze({
  CONTAINER_CLI: process.env.CONTAINER_CLI || "docker",
  CONTAINER_CLI_COMPOSE: process.env.CONTAINER_CLI_COMPOSE,
  DOCKER_SOCK: (process.env.DOCKER_HOST || "/var/run/docker.sock").replace(
    /^unix:\/\//,
    "",
  ),
});

const caScripts = Object.freeze({
  utils: join(TEST_NETWORK_ROOT, "scripts", "utils.sh"),
  ccpGenerate: join(TEST_NETWORK_ROOT, "organizations", "ccp-generate.sh"),
  registerEnrollCA: join(
    TEST_NETWORK_ROOT,
    "organizations",
    "fabric-ca",
    "registerEnroll.sh",
  ),
  registerEnrollCFSSL: join(
    TEST_NETWORK_ROOT,
    "organizations",
    "cfssl",
    "registerEnroll.sh",
  ),
  envVar: join(TEST_NETWORK_ROOT, "scripts", "envVar.sh"),
  ccutils: join(TEST_NETWORK_ROOT, "scripts", "ccutils.sh"),
});

// Compose flags assembled the same way networkUp builds them.
const composeArgs = ({
  containerCli = dockerSettings.CONTAINER_CLI,
  database = networkDefaults.DATABASE,
  useBft = false,
} = {}) => {
  const base = useBft ? fabricCompose.BFT_BASE : fabricCompose.BASE;
  const args = [
    `-f compose/${base}`,
    `-f compose/${containerCli}/${containerCli}-${base}`,
  ];

  if (database === "couchdb") {
    args.push(`-f compose/${fabricCompose.COUCH}`);
  }

  return args.join(" ");
};

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const fabricConfig = {
  msp_id: required("FABRIC_MSP_ID"),
  channel_name: required("FABRIC_CHANNEL_NAME"),
  chaincode_name: required("FABRIC_CHAINCODE_NAME"),

  peer_endpoint: required("FABRIC_PEER_ENDPOINT"),
  peer_host_alias: required("FABRIC_PEER_HOST_ALIAS"),

  crypto_path: process.env.FABRIC_CRYPTO_PATH || null,
  cert_path: required("FABRIC_CERT_PATH"),
  key_directory_path: required("FABRIC_KEY_DIRECTORY_PATH"),
  tls_cert_path: required("FABRIC_TLS_CERT_PATH"),
};

export default Object.freeze({
  fabricVersions,
  networkDefaults,
  fabricCompose,
  fabricPaths,
  organizationPaths,
  dockerSettings,
  caScripts,
  composeArgs,
  fabricConfig,
});

/*
File that handles the environment variables, paths, ports, and hosts
related to the local Hyperledger Fabric blockchain network.
*/
