const joi = require('joi')

signupSchema = joi.object({
  email: joi.string().email().required(),
  firebase_uid: joi.string().required()
});


module.exports = signupSchema;