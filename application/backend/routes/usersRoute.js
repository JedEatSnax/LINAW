const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')

router.use(authenticate.decodeToken)
router.post('/signup',   userController.signup) // (create users)
router.post('/login',  userController.login) // (create session/get firebaseUID token  )

module.exports = {router};