const joi = require('joi')

networkCreationSchema = joi.object ({
    Name: joi.toString()
})

module.exports = networkCreationSchema;