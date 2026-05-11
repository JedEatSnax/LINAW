const authorize = require('../config/authorization/authorization')
const policies = require('../config/authorization/rules')

const authorization = {
    can(requiredPermission) {
        return (req,res,next) => {
            const user = req.user

            if(!user) {
                return res.status(401).json({message: 'UNAUTHORIZED'})
            }

            const userRole = user.role

            const rolePermisions = authorize[userRole] || []

            if(!rolePermisions.includes(requiredPermission)) {
                return res.status(403).json({message: 'FORBIDDEN'})
            }

            const policyFn = policies[requiredPermission]

            if(policyFn && !policyFn(req.user, req, res)){
                return res.status(403).json({message:'Policy check failed'})
            }

            next()
        }
    }
}

module.exports = authorization
