const auth = require('../middleware/authenticate')
const networkService = require('../service/networkService')

class networkController {
    async networkCreation(req, res, next) {
        try {
            await authenticate.decodeToken(req, res, () => { })

            const network = await networkService.networkCreation({
                ...req.body,
                name: req.network.Name,
            })

            if (!network) {
                return res.status(400).json({
                    message: 'Network creation failed'
                })
            }

            return res.status (201).json({
                network: network,
                message: 'Network created successfully'
            })
        } catch (error) {
            res.status(500).json({ message: 'Server error'})
        }
    }

    async networkMember (req, res) {
        try {
            
            
        } catch (error) {
            
        }
    }

    async organization (req, res){
        try {
            await authenticate.decodeToken(req, res, () => {})

            const organization = await networkService.organizationCreation({
                ...req.body,
                name: req.organization.Name
            })

            if (!organization) {
                return res.status(400).json({
                    message: 'Organization creation failed'
                })
            }

            return res.status(201).json({
                organization: organization,
                message: 'Organization created successfully'
            })

        } catch (error) {
            res.status(500).json({message: 'Server error'})
        }
    }

    async node (req, res) {

    }
 
}

module.exports = new networkController()