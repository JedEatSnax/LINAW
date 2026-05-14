const db = require("../../db/db");

const TABLE = "organization_invites";

class OrganizationInviteDao {
	async findActiveByOrganizationAndEmail({ organization_id, tenant_id, invited_email, user_id }) {
		const email = invited_email ?? user_id;

		const invite = await db(TABLE)
			.where({ tenant_id, organization_id, invited_email: email, status: "pending" })
			.andWhere("expires_at", ">", db.fn.now())
			.orderBy("created_at", "desc")
			.first();

		return invite || null;
	}

	async findByTokenHash(token_hash) {
		const invite = await db(TABLE).where({ token_hash }).first();
		return invite || null;
	}

	async create({
		tenant_id,
		organization_id,
		invited_email,
		role,
		token_hash,
		status,
		expires_at,
		invited_by,
	}) {
		const [invite] = await db(TABLE)
			.insert({
				tenant_id,
				organization_id,
				invited_email,
				role,
				token_hash,
				status,
				expires_at,
				invited_by,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return invite;
	}

	async markAccepted({ invite_id, invitedId, tenant_id, accepted_by, acceptedBy }) {
		const id = invite_id ?? invitedId;
		const acceptedByValue = accepted_by ?? acceptedBy;

		const query = db(TABLE).where({ invite_id: id });
		if (tenant_id) query.andWhere({ tenant_id });

		const [invite] = await query
			.update({
				status: "accepted",
				accepted_by: acceptedByValue,
				accepted_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return invite || null;
	}
}

module.exports = new OrganizationInviteDao();

