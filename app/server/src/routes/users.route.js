const express = require('express')
const router = express.Router()
//const requireAuth = require('./requireAuth')
const authController = require('../controllers/authUser.controller')

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.post('/users', authController.users)
router.post('/tenants', authController.tenants)

router.get('/me', authController.me)
router.get('/users', authController.users)
router.get('/tenants', authController.tenants)

module.exports = {router};