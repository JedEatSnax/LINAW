const express = require('express')
const router = express.Router()
<<<<<<< HEAD
const userController = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')
const { strictLimiter, apiLimiter } = require('../middleware/rateLimiter')

router.use(authenticate.decodeToken)
router.post('/signup', strictLimiter, userController.signup) // (create users)
router.post('/login', strictLimiter, userController.login) // (create session/get firebaseUID token  )
=======
//const requireAuth = require('./requireAuth')
const userController = require('../controllers/userController')

router.post('/signup', userController.signup) // (create user)
router.post('/login', userController.login) // (create session/get firebaseUID token  )
// router.post('/logout', userController.logout) // (terminations of cookie sessions)
// router.post('/users', userController.users) // (admin create user)
// router.post('/tenants', userController.tenants)

// router.get('/me', userController.me) // (get current user profile)
// router.get('/users', userController.users) // 
// router.get('/tenants', userController.tenants)
>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)

module.exports = {router};