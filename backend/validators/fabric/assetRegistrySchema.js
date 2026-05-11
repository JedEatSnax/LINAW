const joi = require('joi')

const assetIdParam = joi.object({
    id: joi.string().trim().min(1).max(128).required()
}).required()

const createAssetSchema = joi.object({
    params: assetIdParam,
    body: joi.object({
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(128).required(),
        appraisedValue: joi.number().positive().max(999999999).required()
    }).required()
}).required()

const assetTransferSchema = joi.object({
    params: assetIdParam,
    body: joi.object({
        owner: joi.string().trim().min(1).max(128).required()
    }).required(),
}).required()

const assetUpdateSchema = joi.object({
    params: assetIdParam,
    body: joi.object({
        color: joi.string().trim().min(1).max(50).required(),
        size: joi.number().integer().positive().max(1000000).required(),
        owner: joi.string().trim().min(1).max(128).required(),
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
    assetIdParam,
    createAssetSchema,
    assetTransferSchema,
    assetUpdateSchema,
    assetReadSchema,
    assetDeleteSchema
}
