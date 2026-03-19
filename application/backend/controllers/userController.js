const auth = require('../middleware/authenticate')
const userService = require('../service/userService')
class userController {
    async signup (req, res) {
        try {
            await authenticate.decodeToken(req, res, () => {})

            const user = await userService.signup({
                ...req.body,
                firebase_uid: req.user.firebase_uid
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Signup failed',
                })
            }

            return res.status (201).json({
                id: user.id,
                username: user.username,
                message: 'Signup successful'
            })
        }catch (err){
            res.status(500).json({ message: 'Server error' });
        }
    }

    async login (req, res) {
        try {
            await authenticate.decodeToken(req,res, () => {})
            
            const user = await userService.login({
                ...req.body, 
                firebase_uid: req.user.firebase_uid
            })
            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or firebase_uid',
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