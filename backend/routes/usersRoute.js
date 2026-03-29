const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')
const { strictLimiter } = require('../middleware/rateLimiter')



router.post('/signup', strictLimiter,  authenticate.decodeToken, userController.signup) // (create users)
router.post('/login', strictLimiter, authenticate.decodeToken , userController.login) // (create session/get firebaseUID token  )

module.exports = {router};
