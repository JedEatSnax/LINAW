const auth = require('../middleware/auth')
const networkService = require('../service/networkService')

class networkController {
    async network(req, res, next) {
        try {
            await auth.decodeToken(req, res, () => { })

            const network = await networkService.network({
                ...req.body,
                networkname: req.network.networkName,
                organisationName: req.network.organizationName

            })

            if (!network) {
                return res.status(400).json({
                    message: 'Network creation fi'
                })
            }
        } catch (error) {

        }
    }
}

module.exports = new networkController()