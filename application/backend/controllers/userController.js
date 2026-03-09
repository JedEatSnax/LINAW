const userService = require('../service/userService')

class userController {
    async signup (req, res) {
        try {
            const user = await userService.signup(req.body)
            res.status(201).json(user)
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