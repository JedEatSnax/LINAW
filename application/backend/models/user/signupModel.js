const joi = require('joi')

signupSchema = joi.object({
  email: joi.string().email().required(),
  firebaseUID: joi.string().required()
});


module.exports = signupSchema;