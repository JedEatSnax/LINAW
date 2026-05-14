const db = require('../db/db');
const AppError = require('../utils/appError');

class tenantStorageDao {
    async findByTenantId(tenant_id){
        if(!tenant_id) throw new AppError('Tenant ID is required', 400);

        return db('tenant_storage')
        .where({ tenant_id })
        .first();
    }

    async create({ tenant_id, provider, bucket_name }) {
        const [record] = await db('tenant_storage')
        .insert({
            tenant_id,
            provider,
            bucket_name,
        })
        .returning('*');
        
        return record;
    }
}

module.exports = new tenantStorageDao();