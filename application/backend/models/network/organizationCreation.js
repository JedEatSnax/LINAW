const joi = require ('joi')

organizationSchema = joi.object ({
    name: joi.string().trim().required()
})

module.exports = organizationSchema;