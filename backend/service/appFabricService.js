class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

const {

} = require('../validators/network');

class appFabricService {
  constructor() {
    this.schemas = {

    };

  }

    validate(schemaKey, data) {
    const schema = this.schemas[schemaKey];

    if (!schema) {
        throw new Error(`Validation schema not found for key: ${schemaKey}`);
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

}

module.exports = new appFabricService();