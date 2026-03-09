const joi = require('joi')

signupSchema = joi.object({
  email: joi.string().email().required(),
  username: joi.string().min(3).required(),
  firebaseUID: joi.string().required()
});


module.exports = signupSchema;