const {
  networkCreationSchema,
  networkMemberAdditionSchema,
  organizationSchema,
  nodeSchema
} = require('../models/network');

class NetworkService {
  constructor() {
    this.schemas = {
      networkCreationSchema,
      networkMemberAdditionSchema,
      organizationSchema,
      nodeSchema
    };

    this.networkDao = require('../dao/networkDao');
  }

  validate(schemakey, data) {
    const schema = this.schemas[schemakey];
    if (!schema) throw new Error(`Schema not found for ${schemakey}`);

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new Error(error.details.map(d => d.message).join(', '));
    }

    return value;
  }

  async networkCreation({name}) {
    const validated = this.validate('networkCreationSchema', {name});

    const payload = {
      name: validated.name
    }

    return this.networkDao.networkCreation(payload);
  }

  async networkMemberAddition({name, role}) {
    const validated = this.validate('networkMemberAdditionSchema', {name, role});
    
    const users = await this.userDao.findByFirebaseUid(firebase_uid);
    if (!users) throw new Error ('users not found')
    
      const payload = {
        ...validated,
        name: users.id,
        network_id: networkID,
        role 
      };

    return this.networkDao.networkMemberAddition(payload);
  }

  async organizationCreation({name, networkId, firebase_uid}) {
    const validated = this.validate('organization', { name, networkId, firebase_uid });

    const users = await this.userDao.findByFirebaseUid(firebase_uid);
    if (!users) throw new Error ('users not found');

    const payload = {
        ...validated,
        orgnization_name: organization_name,
        network_id: networkId,
        created_by: users.id,
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
