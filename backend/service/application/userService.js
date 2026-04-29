const userDao = require('../../dao/userDao')
const userSchema = require('../../validators/user')
const AppError = require('../../utils/AppError')

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class userService {
  constructor() {
    this.schemas = userSchema
  }

  validate(schemaKey, data) {
    const schema = this.schemas[schemaKey]

    if(!schema) {
      throw new Error (`Validation schema not found for key: ${schemaKey}`)
    }
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    })

    if(error) {
      throw new ValidationError (
        'Validation failed',
        error.details.map(d => d.message)
      )
    }

    return value
  }

  async signup (body, user) {
    const validated = this.validate('signupSchema', { body })

    const { email } = validated.body

    const created = await userDao.signup({
      email: email,
      firebase_uid: user?.uid
    })

    return created
  }

  async login  (body, user) {
    const validated = this.validate('loginSchema', { body })

    const { email } = validated.body

    const userRow = await userDao.login({
      email: email,
      firebase_uid: user?.uid
    })

    return userRow
  }

}

module.exports = new userService()