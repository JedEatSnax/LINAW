const joi = require('joi')

const signupSchema = joi.object({
  body: joi.object({
      email: joi.string().email().required()
  })
});

const loginSchema = joi.object ({
  body: joi.object({
    email: joi.string().email().required(),
  })
})


module.exports = {
  signupSchema,
  loginSchema
};