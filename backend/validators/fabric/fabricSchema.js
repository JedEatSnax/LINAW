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

const networkCreateSchema = joi.object({
    body: joi.object({
        name: joi.string().trim().min(3).max(100).required(),
        description: joi.string().trim().max(255).optional(),
        orgs: joi.array()
            .items(
                joi.object({
                    name: joi.string().trim().min(2).max(100).required(),
                    msp_ID: joi.string().trim().min(2).max(100).required()
                })
            )
            .min(1)
            .unique('mspID')
            .required()
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

const assetReadAllSchema = joi.object({
    query: joi.object({
        owner: joi.string().trim().max(256).optional(),
        limit: joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
    }).required()
}).required()

// Backwards-compat alias (existing code uses this misspelling)
const assestReadAllSchema = assetReadAllSchema

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
    assetReadAllSchema,
    assestReadAllSchema
}