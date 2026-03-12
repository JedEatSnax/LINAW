<<<<<<< HEAD
//const authenticate = require('../middleware/authenticate')
const userService = require('../service/userService')
class userController {
    async signup (req, res) {
        try {
            const users = await userService.signup({
                ...req.body,
                firebase_uid: req.body.firebase_uid
            });

            if (!users) {
                return res.status(400).json({
                    message: 'Signup failed',
                })
            }

            return res.status (201).json({
                id: users.id,
                username: users.username,
                message: 'Signup successful'
            })
        }catch (err){
            console.error('Signup controller error:', err)
            res.status(500).json({ message: 'Server error' });
=======
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
>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)
        }
    }

    async login (req, res) {
        try {
<<<<<<< HEAD
            
            const users = await userService.login({
                ...req.body, 
                firebase_uid: req.body.firebase_uid
            })
            if (!users) {
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
=======
            const user = await userService.login(req.body)
            res.status(201).json(user)
        } catch (err){
            console.error(err)
>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)
        }
    }
}

module.exports = new userController();