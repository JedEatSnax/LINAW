const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')
const authenticate = require ('../middleware/authenticate')
const { strictLimiter, apiLimiter } = require('../middleware/rateLimiter')

router.use(authenticate.decodeToken)

router.post('/network', strictLimiter, networkController.networkCreation)
router.post('/network/member', apiLimiter, networkController.networkMember)
router.post('/network/organization', apiLimiter, networkController.organization)



module.exports = {router};