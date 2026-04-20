const joi = require('joi')

const objectIdlike = joi.string().trim().min(1).max(128).required()

const assetIdParam = joi.object({
    id: joi.string().trim().min(1).max(128).required()
}).required()

const networkIdParam = joi.object({
    id: objectIdlike.required()
}).required()

const channelIdParam = joi.object({
    channel_id: objectIdlike.required()
}).required()

const orgCreateSchema = joi.object({
    name: joi.string().alphanum().min(2).max(30).required(),
    mspId: joi.string().alphanum().min(2).max(30).required(),
    peerCount: joi.number().integer().min(1).max(5).required(),
});

const resourceLimitSchema = joi.object({
    cpus: joi.string()
        .pattern(/^(0(\.\d+)?|[1-9]\d*(\.\d+)?)$/)
        .default('0.5'),
    memory: joi.string()
        .pattern(/^\d+(B|K|KB|M|MB|G)$/)
        .default('512M'),
});

const networkCreateSchema = joi.object({
    config: joi.object({
        name: joi.string().trim().min(3).max(100).required(),
        orgs: joi.array().items(orgCreateSchema).min(1).unique('mspId').required(),
        consensus: joi.string().valid('etcdraft', 'solo').default('etcdraft'),
        channelPolicy: joi.string().valid('MAJORITY', 'ALL', 'ANY').default('MAJORITY'),
        channelId: joi.string().alphanum().min(3).max(30).default('mychannel'),
        stateDb: joi.string().valid('couchdb', 'leveldb').default('couchdb'),
        ordererCount: joi.number().integer().valid(1, 3, 5).default(1),
        resources: joi.object({
            peer: resourceLimitSchema.default({ cpus: '0.5', memory: '512M' }),
            orderer: resourceLimitSchema.default({ cpus: '0.25', memory: '256M' }),
            ca: resourceLimitSchema.default({ cpus: '0.1', memory: '128M' }),
        }).default(),
    }).required()
}).required()

// NOTE: current route is GET /networks (no :id). Keep this schema permissive.
const networkReadSchema = joi.object({
    params: joi.object().optional(),
    query: joi.object().optional()
}).required()

const channelCreateSchema = joi.object({
    params: networkIdParam,
    body: joi.object({
        name: joi.string()
            .trim()
            .lowercase()
            .pattern(/^[a-z][a-z0-9-]{0,60}$/)
            .required(),
        memberOrgs: joi.array()
            .items(
                joi.string().trim().min(1).max(100)
            )
            .min(1)
            .required()
    }).required()
}).required()

// NOTE: current route is GET /networks/:id/channels (network id)
const channelReadSchema = joi.object({
    params: networkIdParam
}).required()

const smartContractSchema = joi.object({
    params: channelIdParam,
    body: joi.object({
        contractType: joi.string().trim().min(2).max(100).required(),
        contractName: joi.string().trim().min(2).max(100).optional(),
        version: joi.string().trim().min(1).max(20).optional()
    }).required()
}).required()

const contractReadAllSchema = joi.object({
    params: channelIdParam
}).required()

const createAssetSchema = joi.object({
    body: joi.object({
        id: joi.string().trim().min(1).max(128).required(),
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(256).required(),
        appraisedValue: joi.number().positive().max(999999999).required()
    }).required()
}).required()

const assetTransferSchema = joi.object({
    params: assetIdParam,
    body: joi.object({
        owner: joi.string().trim().min(1).max(256).required()
    }).required()
}).required()

const assetUpdateSchema = joi.object({
    params: assetIdParam,
    body: joi.object({
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(256).required(),
        appraisedValue: joi.number().positive().max(999999999).required()
    }).required()
}).required()

const assetReadSchema = joi.object({
    params: assetIdParam
}).required()

const assetDeleteSchema = joi.object({
    params: assetIdParam
}).required()



module.exports = {
    networkCreateSchema,
    networkReadSchema,
    channelCreateSchema,
    channelReadSchema,
    smartContractSchema,
    contractReadAllSchema,
    createAssetSchema,
    assetTransferSchema,
    assetUpdateSchema,
    assetReadSchema,
    assetDeleteSchema
}