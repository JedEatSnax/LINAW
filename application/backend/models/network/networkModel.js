const joi = require('joi')

netowrkSchema = joi.object ({
    networkName: joi.toString().netowrkName().required(),
    organizationName: joi.toString().orgName().required()
})

module.exports = netowrkSchema;