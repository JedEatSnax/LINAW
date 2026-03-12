const joi = require('joi')

loginSchema = joi.object ({
  email: joi.string().email().required(),
  firebaseUID: joi.string().required()
})

module.exports = loginSchema