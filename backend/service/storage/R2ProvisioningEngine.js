const AppError = require('../../utils/AppError');
const tenantStorageDao = require('../../dao/tenantStorageDao');
const cloudflareR2Dao = require('../../dao/cloudflareR2Dao');

class R2ProvisioningEngine {
  constructor({ tenantStorageDao, cloudflareR2Dao }) {
    this.tenantStorageDao = tenantStorageDao;
    this.cloudflareR2Dao = cloudflareR2Dao;
  }

  buildBucketName(tenant_id, tenant_name) {
    const slug = String(tenant_name || 'tenant')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
      .slice(0, 30);

    const shortId = String(tenant_id).replace(/-/g, '').slice(0, 12);
    return `linaw-${slug || 'tenant'}-${shortId}`.slice(0, 63);
  }

  async provisionTenantBucket({ tenant_id, tenant_name }) {
    if (!tenant_id) {
      throw new AppError('Tenant ID is required', 400, 'MISSING_TENANT_ID');
    }

    const existing = await this.tenantStorageDao.findByTenantId(tenant_id);
    if (existing) return existing;

    const bucketName = this.buildBucketName(tenant_id, tenant_name);

    await this.cloudflareR2Dao.createBucket(bucketName);

    const record = await this.tenantStorageDao.create({
      tenant_id,
      provider: 'cloudflare_r2',
      bucket_name: bucketName,
    });

    return record;
  }
}

module.exports = new R2ProvisioningEngine({
  tenantStorageDao,
  cloudflareR2Dao,
});