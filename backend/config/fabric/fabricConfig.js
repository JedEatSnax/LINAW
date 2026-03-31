const versions = Object.freeze({
    FABRIC_VERSION: '${FABRIC_VERSION:-2.5.15}',
    FABRIC_CA_VERSION: '${FABRIC_CA_VERSION:-1.5.17}',
    CRYPTOGEN: 'Certificate Authorities',
});

const fabricCompose = Object.freeze({
    CA_COMPOSE: '~/backend/config/compose/certificate-authority.yml',
    COUCH_COMPOSE: '~/backend/config/compose/couch-db.yml',
    BFT_COMOSE: '~/backend/config/compose/byzantine-fault-tolerant.yml',
});

const fabricPaths = Object.freeze({
    INSTALL_ROOT: '/usr/local/fabric',
    BIN_DIR: '/usr/local/fabric/bin',
    CONFIG_DIR: '/usr/local/fabric/config',
    ORG_DIR: '/usr/local/fabric/organizations',
    TMP_DIR: '$(mktemp -d)',
});

const organizationPaths = Object.freeze({
    PEER_ORG_DIR: `${fabricPaths.ORG_DIR}/peerOrganizations`,
    ORDERER_ORG_DIR: `${fabricPaths.ORG_DIR}/ordererOrganizations`,
    CERT_AUTHORITY_DIR: `${fabricPaths.ORG_DIR}/certificate-authorities`,
});

module.exports = Object.freeze({
    versions,
    fabricPaths,
    organizationPaths,
});