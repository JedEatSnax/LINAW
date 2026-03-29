class userService {
    constructor() {
        const { signupSchema, loginSchema } = require('../models/user')
        this.schemas = { signupSchema, loginSchema}
        this.userDao = require('../dao/userDao')
    }

    validate(method, data){
        const schema = this.schemas[`${method}Schema`]
        const { error, value } = schema.validate(data)
        if (error) throw new Error(error.details.map(d => d.message).join(','))
        return value
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