const authorizeConfig = require('../config/authorization/authorization')
const policies = require('../config/authorization/rules')
const AppError = require('../utils/AppError')

const authorization = {
    can(requiredPermission) {
        return (req, res, next) => {
            const user = req.user

            if (!user) {
                return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'))
            }

            const userRole = user.role
            const rolePermissions = authorizeConfig[userRole] || []

            if (!rolePermissions.includes(requiredPermission)) {
                return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
            }

            const policyFn = policies[requiredPermission]

            try {
                if (policyFn && !policyFn(req.user, req, res)) {
                    return next(new AppError('Policy check failed', 403, 'FORBIDDEN'))
                }
            } catch (err) {
                return next(err)
            }

            return next()
        }
    }
}

module.exports = authorization