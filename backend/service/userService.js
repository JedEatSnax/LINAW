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
        const { signupSchema, loginSchema } = require('../validators/user');
        this.schemas = {
        signup: signupSchema,
        login: loginSchema,
        };
        this.userDao = require('../dao/userDao');
    }

  validate(method, data) {
    const schema = this.schemas[method];

    if (!schema) {
      throw new Error(`Validation schema not found for method: ${method}`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
        throw new ValidationError(
            'Validation failed',
            error.details.map(d => d.message)
            );
        }

        return value;
    } 

    signup(data) {
        const validated = this.validate('signup', data)
        return this.userDao.signup(validated)
    }

    login(data){
        const validated = this.validate('login', data)
        return this.userDao.login(validated)
    }
}

module.exports = new userService()