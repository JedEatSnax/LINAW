const express = require('express')
const router = express.Router()

const userController = require('../controllers/userController')

router.post('/signup', userController.signup) // (create users)
router.post('/login', userController.login) // (create session/get firebaseUID token  )
// router.post('/logout', userController.logout) // (terminations of cookie sessions)
// router.post('/users', userController.users) // (admin create users)
// router.post('/tenants', userController.tenants)

// router.get('/me', userController.me) // (get current users profile)
// router.get('/users', userController.users) // 
// router.get('/tenants', userController.tenants)

module.exports = {router};