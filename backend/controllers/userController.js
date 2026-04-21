const userService = require('../service/application/userService')

class userController {
    async signup (req, res, next) {
        try {
            const user = await userService.signup(req.body)
            if (!user) {
                return res.status(400).json({
                    message: 'Signup failed',
                })
            }

            return res.status (201).json({
                email: user.email,
                message: 'Signup successful',
            })
        }catch (err){
            return next(err)
        }
    }

    async login (req, res, next) {
        try {
            const user = await userService.login(req.body)

            if (!user) {
                return res.status(400).json({
                    message: 'login failed'
                })
            }

            return res.status(200).json({
                email: user.email,
                message: 'Login Successful'
            })
        } catch (err){
            return next(err)
        }
    }
}

module.exports = new userController();