const joi = require('joi')

networkMemberAdditionSchema = joi.object ({
    name: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    role: joi.string().valid('networkAdmin', 'member', 'node_manager').required()
})

module.exports = networkMemberAdditionSchema;