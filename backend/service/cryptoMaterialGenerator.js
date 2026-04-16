const logger = require('../utils/logger')

async function generateCryptoMaterial() {
    /* 
    TODO:
    - bootstrap TLS CA
    - bootstrap Orderer CA
    - enroll Orderer CA Admin
    - build Orderer Org's Identity
    - store private keys to vault
    */
}

module.exports = { generateCryptoMaterial }