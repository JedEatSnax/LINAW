require('dotenv').config();

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    fabricBinPath: process.env.FABRIC_BIN_PATH || '/opt/fabric/bin',
    networksPath: process.env.NETWORKS_PATH || '/var/app/networks',
    fabricVersion: process.env.FABRIC_VERSION || '2.5',
    fabricCAVersion: process.env.FABRIC_CA_VERSION || '1.5',
};