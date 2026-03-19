const joi = require('joi')

nodeSchema = joi.object ({
    name: joi.string().trim().required(),
    type: joi.string().valid('peer', 'orderer', 'ca').required(),
    status: joi.string().valid('provisioning', 'active')
})

module.exports = nodeSchema;