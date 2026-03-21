const networkService = require('../service/networkService')

class networkController {
    async networkCreation(req, res) {
        try {
            const network = await networkService.networkCreation({ 
                name: req.body.name
            })

            if (!network) {
                return res.status(400).json({
                    message: 'Network creation failed'
                })
            }

            return res.status (201).json({
                network,
                message: 'Network created successfully'
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Server error'})
        }
    }

    async networkMember (req, res) {
        try {
            const networkMember = await networkService.networkMemberAddition({
                name: req.body.name,
                email: req.body.email,
                role: req.body.role
            })
            
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Server error'})
        }
    }

    async organization (req, res){ 
        try {
            const organization = await networkService.organizationCreation({
                ...req.body,
                name: req.organization.name,
                network: req.organization.networkId,
                firebase_uid: req.body.uid
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
            console.error(error)
            res.status(500).json({message: 'Server error'})
        }
    }

    // async node (req, res) {

    // }
 
}

module.exports = new networkController()