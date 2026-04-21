const networkAssetsService = require('../service/application/networkAssetsService')

class fabricController {
    async networkCreate(req, res, next) {
        try {
            const network = await networkAssetsService.networkCreate({
                body: req.body,
                user: req.user
            })

            return res.status(201).json(network)
            } catch (error) {
                next(error)
        }
    }

    async networkRead (req, res, next) {
        try {
            const read = await networkAssetsService.networkRead({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(read)
        } catch (error) {
            next(error)
        }
    }


    async channelCreate (req, res, next) {
        try {
            const channel = await networkAssetsService.channelCreate({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(201).json(channel)
        } catch (error) {
            next(error)
        }
    }

    async channelRead (req, res, next) {
       try {
            const read = await networkAssetsService.channelRead({
            params: req.params,
            user: req.user
            })

              return res.status(200).json(read)
       } catch (error) {
            next(error)
       }
    }

    async smartContract (req, res, next) {
        try {
            const contract = await networkAssetsService.smartContract({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(201).json(contract)
        } catch (error) {
            next(error)
        }
    }

    async contractReadAll (req, res, next) {
        try {
            const contracts = await networkAssetsService.contractReadAll({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(contracts)
        } catch (error) {
            next(error)
        }
    }


    async createAsset(req,res, next) {
        try {
            const create = await networkAssetsService.createAsset({
                body: req.body,
                user: req.user
            })

            return res.status(201).json(create)
        } catch (error) {
            next(error)
        }
    }

    async assetTransfer (req, res, next) {
        try {
            const transfer = await networkAssetsService.assetTransfer({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(transfer)
        } catch (error) {
            next(error)
        }
    }

    async assetUpdate (req, res, next) {
        try {
            const update = await networkAssetsService.assetUpdate({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(update)
        } catch (error) {
            next(error)
        }
    }

    async assetDelete (req, res, next) {
        try {
            const deleted = await networkAssetsService.assetDelete({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(deleted)
        } catch (error) {
            next(error)
        }
    }

    async assetRead (req, res, next) {
        try {
            const read = await networkAssetsService.assetRead({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(read)
        } catch (error) {
            next(error)
        }
    }

    async assetReadAll (req, res, next) {
        try {
            const readAll = await networkAssetsService.assetReadAll({
                user: req.user
            })

            return res.status(200).json(readAll)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new fabricController()