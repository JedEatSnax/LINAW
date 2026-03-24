const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')
const authenticate = require ('../middleware/authenticate')

router.use(authenticate.decodeToken)

router.post('/network', networkController.networkCreation)
router.post('/network/member', networkController.networkMember)
router.post('/network/organization', networkController.organization)



module.exports = {router};