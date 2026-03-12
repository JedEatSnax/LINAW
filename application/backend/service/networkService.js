class networkService {
    constructor() {
        const { netowrkSchema } = require ('../models/network')
        this.schemas = {netowrkSchema}
        this.networkDao = require('../dao/networkDao')   
    }

    validate(method, data){
        const schema = this.schemas[`${method}Schema`]
        const { error, value } = schema.validate(data)
        if (error) throw new Error(error.details.map(d => d.message).json(','))
        return value
    }

    network(data){
        const validated = this.validate('network', data)
        return this.networkDao.network(validated)
    }
}