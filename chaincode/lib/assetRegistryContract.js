'use-strict'

const stringify = require ('json-stringify-deterministic')
const sortKeysRecursive = require ('sort-keys-recursive')
const { contract } = require ('fabric-contract-api')

class assetRegistryContract extends contract {
    async assetExist (ctx, id) {
        const assetJSON = await ctx.stub.getState(id)
        return assetJSON && assetJSON.length > 0
    }

    async createAsset (ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id)

        if (exists) {
            throw new Error (`The asset ${id} already exists`)
        }

        const asset = {
            Id: id,
            Color: color,
            Size: Number(size),
            Owner: owner,
            AppraisedValue: Number(appraisedValue)
        }

        await ctx.stub.putState( id, Buffer.from(stringify(sortKeysRecursive(asset))))
        return JSON.stringify(asset)
    }

    async transferAsset (ctx, id, owner) {
        const assetString = await this.ReadAsset(ctx, id)
        const asset = JSON.parse(assetString)
        const oldOwner = asset.Owner

        asset.Owner = newOwner

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))))
        return oldOwner
    }

    async updateAsset (ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id)

        if (!exists) {
            throw new Error (`The asset ${id} does not exist`)
        }

        const updatedAsset = {
            Id: id,
            Color: color,
            Size: Number(size),
            Owner: owner,
            AppraisedValue: Number(appraisedValue) 
        }

        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))))
        
    }

    async deleteAsset (ctx, id) {
        const exists = await this.AssetExists (ctx, id)

        if (!exists) {
            throw new Error (`The asset ${id} does not exist`)
        }

        return ctx.stub.deleteState(id)
    }

    async readAsset (ctx, id) {
        const AssetJSON = await ctx.stub.getState(id)

        if(!assetJSON || assetJSON.length === 0 ) {
            throw new Error (`The asset ${id} does not exist`)
        }

        return assetJSON.toString()
    }

    async readAllAsset (ctx) {
        const allResult = []
        
        const iterator = await ctx.stub.getStateByRange('','')

        let result = await iterator.next()

        while(!result){
            const strValue = Buffer.from(result.value.value.toStrirng()).toString('utf8')

            let record
            try {
                record = JSON.parse(strValue)
            } catch (error) {
                console.log(error)
                record = strValue
            }

            allResult.push(record)
            result = await iterator.next()
        }
        return JSON.stringify(allResults);
    }
}

module.exports = assetRegistryContract