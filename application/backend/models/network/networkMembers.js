const joi = require('joi')

networkMemberSchema = joi.object ({
    email: joi.string().email().trim().required(),
    role: joi.string().valid('networkAdmin', 'member', 'node_manager').required()
})

module.exports = networkMemberSchema;