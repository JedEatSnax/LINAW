const joi = require('joi')

const signupSchema = joi.object({
  email: joi.string().email().required()
});


module.exports = signupSchema;