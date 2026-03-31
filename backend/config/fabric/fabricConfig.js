
FABRIC_VERSION = "${FABRIC_VERSION:-2.5.15}";
FABRIC_CA_VERSION = "${FABRIC_CA_VERSION:-1.5.17}";
CRYPTOGEN = "Certificate Authorities";
CERT_AUTHORITY_COMPOSE = "~/backend/config/compose/certificate-authority.yml"


INSTALL_ROOT = "/usr/local/fabric";
BIN_DIR = "${INSTALL_ROOT}/bin";
CONFIG_DIR = "${INSTALL_ROOT}/config";
ORG_DIR = "${INSTALL_ROOT}/organizations"
TMP_DIR = "$(mktemp -d)";


// Unfinished and Incomplete
PEER_ORG_DIR = "${ORG_DIR}/peerOrganizations"
ORDERER_ORG_DIR = "${ORG_DIR}/ordererOrganizations"
CERT_AUTHORITY_DIR = "${ORGANIZATION_DIR}/certificate-authorities"