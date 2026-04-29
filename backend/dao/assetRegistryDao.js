const db = require('../db/db');

class AssetRegistryDao {
    async createAsset(data) {
        try {
            const {
                id,
                color,
                size,
                owner,
                appraisedValue,
                requestedBy
            } = data;

            const [asset] = await db('asset_registry')
                .insert({
                    id,
                    color,
                    size,
                    owner,
                    appraised_value: appraisedValue,
                    created_by: requestedBy,
                    updated_by: requestedBy,
                    created_at: db.fn.now(),
                    updated_at: db.fn.now()
                })
                .returning('*');

            return asset;
        } catch (error) {
            if (error.code === '23505') throw new Error('ASSET_ALREADY_EXISTS');
            throw error;
        }
    }

    async assetTransfer(data) {
        try {
            const {
                id,
                owner,
                requestedBy
            } = data;

            const [asset] = await db('asset_registry')
                .where({ id })
                .update({
                    owner,
                    updated_by: requestedBy,
                    updated_at: db.fn.now()
                })
                .returning('*');

            return asset || null;
        } catch (error) {
            if (error.code === '23505') throw new Error('ASSET_TRANSFER_FAILED');
            throw error;
        }
    }

    async assetUpdate(data) {
        try {
            const {
                id,
                color,
                size,
                owner,
                appraisedValue,
                requestedBy
            } = data;

            const [asset] = await db('asset_registry')
                .where({ id })
                .update({
                    color,
                    size,
                    owner,
                    appraised_value: appraisedValue,
                    updated_by: requestedBy,
                    updated_at: db.fn.now()
                })
                .returning('*');

            return asset || null;
        } catch (error) {
            if (error.code === '23505') throw new Error('ASSET_UPDATE_FAILED');
            throw error;
        }
    }

    async assetDelete(data) {
        try {
            const { id } = data;

            const deletedRows = await db('asset_registry')
                .where({ id })
                .del();

            return deletedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    async assetRead(data) {
        try {
            const { id } = data;

            const asset = await db('asset_registry')
                .select('*')
                .where({ id })
                .first();

            return asset || null;
        } catch (error) {
            throw error;
        }
    }

    async assetReadAll(data) {
        try {
            const assets = await db('asset_registry')
                .select('*')
                .orderBy('created_at', 'desc');

            return assets;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AssetRegistryDao();