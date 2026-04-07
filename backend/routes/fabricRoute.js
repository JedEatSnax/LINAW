const express = require('express')
const router = express.Router()
const fabricController = require('../controllers/fabricController')
const authenticate = require ('../middleware/authenticate')
const { apiLimiter } = require('../middleware/rateLimiter')

router.use( apiLimiter, authenticate.decodeToken)

//blockchain 
router.post('/networks', fabricController.networkCreate)

router.post('/networks/:id/channels', fabricController.channelCreate)

router.post('/channel/:channel_id/contracts', fabricController.smartContract)
router.get ('/channel/:channel_id/contracts', fabricController.contractReadAll)

// transaction
router.post('/assets', fabricController.createAsset)
router.post('/assets/:id/transfer', fabricController.assetTransfer)
router.put ('/assets/:id', fabricController.assetUpdate)
router.delete ('/assets/:id', fabricController.assetDelete)
router.get ('/assets/:id', fabricController.assetRead)
router.get ('/assets', fabricController.assetReadAll)

    
module.exports = {router};