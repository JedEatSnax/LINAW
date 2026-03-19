const {
  networkSchema,
  memberSchema,
  organizationSchema,
  nodeSchema
} = require('../models/network');

class NetworkService {
  constructor() {
    this.schemas = {
      networkSchema,
      memberSchema,
      organizationSchema,
      nodeSchema
    };

    this.networkDao = require('../dao/networkDao');
  }

  validate(method, data) {
    const schema = this.schemas[`${method}Schema`];
    if (!schema) throw new Error(`Schema not found for ${method}`);

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new Error(error.details.map(d => d.message).join(', '));
    }

    return value;
  }

  networkCreation(data) {
    const validated = this.validate('network', data);
    return this.networkDao.networkCreation(validated);
  }

  networkMember(data) {
    const validated = this.validate('member', data);
    return this.networkDao.networkMember(validated);
  }

  async organizationCreation({name, networkId, firebase_uid}) {
    const validated = this.validate('organization', { name });

    const user = await this.userDao.findByFirebaseUid(firebase_uid);
    if (!user) throw new Error ('User not found');

    const payload = {
        ...validated,
        network_id: networkId,
        created_by: user.id,
        status: 'creating'
    };

    return this.networkDao.organizationCreation(payload);
  }

  nodeCreation(data) {
    const validated = this.validate('node', data);
    return this.networkDao.nodeCreation(validated);
  }
}

module.exports = new NetworkService();
