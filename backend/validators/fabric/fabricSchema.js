const joi = require('joi')

const objectIdlike = joi.string().trim().min(1).max(128).required()

const assestIdParam = joi.object({
    id: joi.string().trim().required()
})

const networkIdParam = joi.object({
    id: objectIdlike.required()
})

const channelIdParam = joi.object({
    channel_id: objectIdlike.required()
})

const networkCreateSchema = {
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
            .unique()
            .required()
    })
}

const channelCreateSchema = {
    params: networkIdParam,
    body: joi.object({
        name: joi.string()
            .trim()
            .lowercase()
            .pattern(/^[a-z][a-z0-9-][0,60]$/)
            .required(),
        memberOrgs: joi.array()
            .items(
                joi.string().trim().min(1).max(100)
            )
            .min(1)
            .required()
    })
}

const smartcontractSchema = {
    params: channelIdParam,
    body: joi.object({
        contractType: joi.string()
            .valid()
            .required(),
        contractName: joi.string().trim().min(2).max(100).optional(),
        version: joi.string().trim().min(1).max(20).optional()
    })  
}

const createAssetSchema = {
    body: joi.object({
        id: joi.string().trim().min(1).max(128).required(),
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(256).required(),
        appraisedValue: joi.number().positive().max(999999999).required()
    })
}

const assetTransferSchema = {
    params: channelIdParam,
    body: joi.object({
        owner: joi.string().trim().min(1).max(256).required()
    })
}

const assetUpdateSchema = {
    params: assetIdParam,
    body: joi.object({
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(256).required(),
        appraisedValue: joi.number().positive().max(999999999).required()
    })
}

const assetReadSchema = {
    params: assestIdParam
}

const assetReadAllSchema = {
    query: joi.object({
        owner: joi.string().trim().max(256).optional(),
        limit: joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
    })
}

module.exports = {
    networkCreateSchema,
    channelCreateSchema,
    smartcontractSchema,
    createAssetSchema,
    assetTransferSchema,
    assetUpdateSchema,
    assetReadSchema,
    assetReadAllSchema
}