const joi = require('joi')

networkSchema = joi.object ({
    Name: joi.toString().netowrkName().required()
})

module.exports = netowrkSchema;