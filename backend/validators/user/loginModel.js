const joi = require('joi')

const loginSchema = joi.object ({
  email: joi.string().email().required(),
  firebase_uid: joi.string().required()
})

module.exports = loginSchema;