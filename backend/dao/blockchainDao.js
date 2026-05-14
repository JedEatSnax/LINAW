const db = require("../db/db");
const AppError = require("../utils/AppError");

class BlockchainDao {
	// Network operations


	async findNetworkByTenantAndName({ tenant_id, network_name }) {
		if (!tenant_id || !network_name) {
			return null;
		}

		const network = await db("blockchain_network")
			.where({ tenant_id, network_name })
			.first();

		return network || null;
	}


	async getNetworkById(network_id) {
		if (!network_id) {
			return null;
		}

		const network = await db("blockchain_network")
			.where({ network_id })
			.first();

		return network || null;
	}


	async createNetwork({ tenant_id, network_name, created_by }) {
		const [network] = await db("blockchain_network")
			.insert({
				tenant_id,
				network_name,
				created_by: created_by || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return network;
	}


	async updateNetwork({ network_id, updateData }) {
		const [network] = await db("blockchain_network")
			.where({ network_id })
			.update({
				...updateData,
				updated_at: db.fn.now(),
			})
			.returning("*");

		return network || null;
	}


	async upsertNetwork({ tenant_id, network_name, created_by }) {
		const [network] = await db("blockchain_network")
			.insert({
				tenant_id,
				network_name,
				created_by: created_by || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.onConflict(["tenant_id", "network_name"])
			.merge({
				// Preserve created_by if already set, otherwise use the provided value
				created_by: db.raw("COALESCE(??, EXCLUDED.??)", ["created_by", "created_by"]),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return network;
	}

	async getNetworksByTenant(tenant_id) {
		if (!tenant_id) {
			return [];
		}

		const networks = await db("blockchain_network")
			.where({ tenant_id })
			.orderBy("network_name", "asc");

		return networks;
	}

	// Channel operations

	async findChannelByTenantNetworkAndName({ tenant_id, network_id, channel_name }) {
		if (!tenant_id || !network_id || !channel_name) {
			return null;
		}

		const channel = await db("channel")
			.where({ tenant_id, network_id, channel_name })
			.first();

		return channel || null;
	}

	async createChannel({ channel_id, tenant_id, network_id, channel_name, created_by }) {
		const [channel] = await db("channel")
			.insert({
				channel_id,
				tenant_id,
				network_id,
				channel_name,
				created_by: created_by || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return channel;
	}


	async updateChannel({ channel_id, updateData }) {
		const [channel] = await db("channel")
			.where({ channel_id })
			.update({
				...updateData,
				updated_at: db.fn.now(),
			})
			.returning("*");

		return channel || null;
	}


	async upsertChannel({ channel_id, tenant_id, network_id, channel_name, created_by }) {
		const [channel] = await db("channel")
			.insert({
				channel_id,
				tenant_id,
				network_id,
				channel_name,
				created_by: created_by || null,
				created_at: db.fn.now(),
				updated_at: db.fn.now(),
			})
			.onConflict(["tenant_id", "channel_name"])
			.merge({
				network_id,
				// Preserve created_by if already set, otherwise use the provided value
				created_by: db.raw("COALESCE(??, EXCLUDED.??)", ["created_by", "created_by"]),
				updated_at: db.fn.now(),
			})
			.returning("*");

		return channel;
	}


	async getChannelsByNetworkId(network_id) {
		if (!network_id) {
			return [];
		}

		const channels = await db("channel")
			.where({ network_id })
			.orderBy("channel_name", "asc");

		return channels;
	}


	async getChannelsByTenant(tenant_id) {
		if (!tenant_id) {
			return [];
		}

		const channels = await db("channel")
			.where({ tenant_id })
			.orderBy("channel_name", "asc");

		return channels;
	}


	async getBlockchainMetadataByTenant(tenant_id) {
		if (!tenant_id) {
			return {
				networks: [],
				channels: [],
			};
		}

		const networks = await db("blockchain_network")
			.where({ tenant_id })
			.orderBy("network_name", "asc");

		const channels = await db("channel")
			.where({ tenant_id })
			.orderBy("channel_name", "asc");

		return {
			networks,
			channels,
		};
	}
}

module.exports = new BlockchainDao();
