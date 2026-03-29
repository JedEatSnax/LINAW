const userService = require('../service/userService')
const auth = require('../middleware/authenticate')

class userController {
    async signup (req, res) {
        try {
            const user = await userService.signup(req.body)
            if (!user) {
                return res.status(400).json({
                    message: 'Signup failed',
                })
            }

            return res.status (201).json({
                id: user.id,
                username: user.username,
                message: 'Signup successful',
            })
        }catch (err){
            console.error(err)
        }
    }

    async login (req, res) {
        try {
            const user = await userService.login(req.body)
            res.status(201).json(user)
        } catch (err){
            console.error(err)
        }
    }
}

module.exports = new userController();