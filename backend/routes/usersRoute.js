const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')
const { strictLimiter } = require('../middleware/rateLimiter')



router.post('/signup', strictLimiter, userController.signup) // (create users)
router.post('/login', strictLimiter,userController.login) // (create session/get firebaseUID token  )


module.exports = {router};
