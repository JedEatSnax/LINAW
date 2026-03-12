const userService = require('../service/userService')

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
            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or firebaseUID',
                    loggedIn: false,
                })
            }

            return res.status(202).json({
                email: user.email,
                message: 'Login successful',
                loggedIn: true,
            })
        } catch (err){
            console.error(err)
            return res.status(500).json({ message: 'Internal server error' })
        }
    }
}

module.exports = new userController();