'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetRegistryContract extends Contract {
    constructor() {
        super('assetRegistryContract');
    }

    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);

        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            id,
            color,
            size: Number(size),
            owner,
            appraisedValue: Number(appraisedValue)
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.owner;

        asset.owner = newOwner;

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify({ oldOwner });
    }

    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);

        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const updatedAsset = {
            id,
            color,
            size: Number(size),
            owner,
            appraisedValue: Number(appraisedValue)
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        return JSON.stringify(updatedAsset);
    }

    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);

        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        await ctx.stub.deleteState(id);
        return JSON.stringify({ deleted: id });
    }

    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);

        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }

        return assetJSON.toString();
    }

    async GetAllAssets(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');

        for await (const res of iterator) {
            if (res.value && res.value.value) {
                const strValue = Buffer.from(res.value.value).toString('utf8');
                try {
                    const record = JSON.parse(strValue);
                    allResults.push(record);
                } catch (err) {
                    allResults.push(strValue);
                }
            }
        }

        return JSON.stringify(allResults);
    }
}

module.exports = AssetRegistryContract;