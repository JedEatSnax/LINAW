const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')

router.post = ('/network', networkController.networkCreation)
router.post = ('/network', networkController.networkMember)
router.post = ('/network', networkController.organization)
router.post = ('/network', networkController.node)


module.exports = {router};