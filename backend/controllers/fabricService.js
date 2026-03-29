const networkService = require('../service/networkService')

class networkController {
    async networkCreation(req, res) {
        try {
            const network = await networkService.networkCreation({ 
                name: req.user.name
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
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            })

            if (!networkMember) {
                return res.status(400).json({
                    message: 'Network member creation failed'
                })
            }

            return res.status(201).json({
                networkMember,
                message: 'Network member created successfully'
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
            name: req.user.name,
            networkId: req.user.networkId,
            firebase_uid: req.user.uid
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