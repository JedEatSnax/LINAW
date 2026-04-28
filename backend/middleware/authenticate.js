const { auth } = require('../config/firebase-config')

class authenticate {
    async decodeToken (req, res, next) {
        try {
            const authHeader = req.headers.authorization

            if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')){
                return res.status(401).json({
                    error: 'Authorization header is required',
                    code: 'AUTH_MISSING'
                });
            }

            const token = authHeader.split(' ')[1]; 

            if (!token) {
                return res.status(401).json({
                    error: 'Invalid authorization format. Use Bearer <token>',
                    code: 'AUTH_INVALID_FORMAT'
                });
            }

            const decodedToken = await auth.verifyIdToken(token)

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email || null,
                email_verified: decodedToken.email_verified || false,
                role: decodedToken.role || 'user',
                tenantId: decodedToken.tenantId || null,
                claims: decodedToken
            }

            return next()
        } catch (error) {
            return res.status(401).json({
                error: 'Unauthorized',
                code: error.code || 'AUTH_FAILED'
            });
        }
    }
}

module.exports = new authenticate();