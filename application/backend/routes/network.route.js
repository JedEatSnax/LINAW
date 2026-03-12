const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')

router.post = ('/network', networkController.network)


module.exports = {router};