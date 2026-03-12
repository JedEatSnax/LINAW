const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')

router.post = ('/network', networkController.network)

// client
router.get('/network/:id', networkController.monitor)

module.exports = {router};