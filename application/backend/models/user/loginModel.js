const joi = require('joi')

loginSchema = joi.object ({
  email: joi.string().email().required(),
  firebase_uid: joi.string().required()
})

module.exports = loginSchema