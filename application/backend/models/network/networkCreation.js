const joi = require('joi')

networkCreationSchema = joi.object ({
    name: joi.string().trim().required()
})

module.exports = networkCreationSchema;