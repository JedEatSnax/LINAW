const admin = require('../config/firebase-config')

class authenticate {
    async decodeToken (req,res,next){
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')){
            return res.status(401).json({
                message: 'UNAUTHORIZED: No valid Bearer token'
            })
        }

        const token = authHeader.split(' ')[1];

        try {
            const decodedValue = await admin.auth().verifyIdToken(token);

            console.log("Decoded token: ", decodedValue.uid, decodedValue.email)
            
            req.user = decodedValue
            return next()
        } catch (error) {
            res.status(401).json({
                message: 'UNAUTHORIZED: Invalid token'
            })
        }
    }
}

module.exports = new authenticate();