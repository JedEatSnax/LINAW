const assetRegistryService = require('../service/application/assetRegistryService');

class assetRegistryController {
    // Asset registry operations
    async createAsset(req, res, next) {
        try {
            const create = await assetRegistryService.createAsset({
                body: req.body,
                user: req.user
            })

            return res.status(201).json(create)
        } catch (error) {
            next(error)
        }
    }

    async assetTransfer(req, res, next) {
        try {
            const transfer = await assetRegistryService.assetTransfer({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(transfer)
        } catch (error) {
            next(error)
        }
    }

    async assetUpdate(req, res, next) {
        try {
            const update = await assetRegistryService.assetUpdate({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(update)
        } catch (error) {
            next(error)
        }
    }

    async assetDelete(req, res, next) {
        try {
            const deleted = await assetRegistryService.assetDelete({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(deleted)
        } catch (error) {
            next(error)
        }
    }

    async assetRead(req, res, next) {
        try {
            const read = await assetRegistryService.assetRead({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(read)
        } catch (error) {
            next(error)
        }
    }

    async assetReadAll(req, res, next) {
        try {
            const readAll = await assetRegistryService.assetReadAll({
                user: req.user
            })

            return res.status(200).json(readAll)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new assetRegistryController();
