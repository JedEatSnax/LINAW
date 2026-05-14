const { auth } = require('../config/firebase-config')
const AppError = require('../utils/AppError')

class authenticate {
    async decodeToken (req, res, next) {
        try {
            const authHeader = req.headers.authorization

            if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')){
                return next(new AppError('Authorization header is required', 401, 'AUTH_MISSING'))
            }

            const token = authHeader.split(' ')[1]; 

            if (!token) {
                return next(new AppError('Invalid authorization format. Use Bearer <token>', 401, 'AUTH_INVALID_FORMAT'))
            }

            const decodedToken = await auth.verifyIdToken(token)

            // Basic required claims validation
            if (!decodedToken || !decodedToken.uid) {
                return next(new AppError('Missing uid claim', 401, 'INVALID_TOKEN'))
            }

            if (!decodedToken.email) {
                return next(new AppError('Missing email claim', 401, 'INVALID_TOKEN'))
            }

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
            return next(new AppError('Unauthorized', 401, error.code || 'AUTH_FAILED'))
        }
    }
}

module.exports = new authenticate();