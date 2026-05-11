const db = require("../../db/db");

class OrganizationUserDao {
  async findByOrganizationAndUser({
    organization_id,
    organizationId,
    user_id,
    userId,
    tenant_id,
    tenantId,
  }) {
    const membership = await db("organization_users")
      .where({
        tenant_id: tenant_id ?? tenantId,
        organization_id: organization_id ?? organizationId,
        user_id: user_id ?? userId,
      })
      .first();

    return membership || null;
  }

  async create({
    tenant_id,
    tenantId,
    organization_id,
    organizationId,
    user_id,
    userId,
    role,
  }) {
    const [membership] = await db("organization_users")
      .insert({
        tenant_id: tenant_id ?? tenantId,
        organization_id: organization_id ?? organizationId,
        user_id: user_id ?? userId,
        role,
      })
      .returning("*");

    return membership;
  }
}

module.exports = new OrganizationUserDao();
