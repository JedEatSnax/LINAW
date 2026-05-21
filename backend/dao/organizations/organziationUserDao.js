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

	async findMembersByOrganization({ organization_id, tenant_id }) {
		if (!organization_id || !tenant_id) {
			return [];
		}

		return await db("organization_users as ou")
			.leftJoin("users as u", "u.user_id", "ou.user_id")
			.leftJoin("organization_invites as oi", function () {
				this.on("oi.organization_id", "=", "ou.organization_id")
					.andOn("oi.accepted_by", "=", "ou.user_id")
					.andOn("oi.status", "=", db.raw("?", ["accepted"]));
			})
			.where({ "ou.organization_id": organization_id, "ou.tenant_id": tenant_id })
			.select(
				"ou.organization_id",
				"ou.tenant_id",
				"ou.user_id",
				"ou.role",
				"u.user_email",
				"u.created_at as user_created_at",
				"oi.accepted_at"
			)
			.orderBy("u.user_email", "asc");
	}

	async create({ tenant_id, tenantId, organization_id, organizationId, user_id, userId, role }) {
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

	async removeMember({ organization_id, tenant_id, user_id }) {
		const query = db("organization_users").where({ organization_id, tenant_id, user_id });
		const [membership] = await query.delete().returning("*");
		return membership || null;
	}
}

module.exports = new OrganizationUserDao();

