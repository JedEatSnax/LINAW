const db = require("../../db/db");

class OrganizationDao {
	async findById({ organization_id, tenant_id }) {
		const organization = await db("organizations")
			.where({ organization_id, tenant_id })
			.first();

		return organization || null;
	}


	async findOrganizationByTenantAndName({ tenant_id, organization_name }) {
		if (!tenant_id || !organization_name) {
			return null;
		}

		const organization = await db("organizations")
			.where({ tenant_id, organization_name })
			.first();

		return organization || null;
	}


	async createOrganization({ tenant_id, organization_name, msp_id }) {
		const [organization] = await db("organizations")
			.insert({
				tenant_id,
				organization_name,
				msp_id: msp_id || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return organization;
	}


	async updateOrganization({ organization_id, tenant_id, updateData }) {
		const [organization] = await db("organizations")
			.where({ organization_id, tenant_id })
			.update({
				...updateData,
				updated_at: db.fn.now(),
			})
			.returning("*");

		return organization || null;
	}


	async upsertOrganization({ tenant_id, organization_name, msp_id }) {
		const [organization] = await db("organizations")
			.insert({
				tenant_id,
				organization_name,
				msp_id: msp_id || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.onConflict(["tenant_id", "organization_name"])
			.merge({
				...(msp_id ? { msp_id } : {}),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return organization;
	}


	async getOrganizationsByTenant(tenant_id) {
		if (!tenant_id) {
			return [];
		}

		const organizations = await db("organizations")
			.where({ tenant_id })
			.orderBy("organization_name", "asc");

		return organizations;
	}
}

module.exports = new OrganizationDao();

