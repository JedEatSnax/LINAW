const networkManager = require('../services/networkManager');

// for now network creation with only network name and org.
// will implement channel config, MSP, chaincode, and more later.
exports.createNetwork = async (req, res, next) => {
    try {
      const network = await networkManager.createNetwork(
        req.body.network_name, 
        req.body.org_name
      );
        res.status(200).json(network)
    }catch (error){
        next(error)
    }
}

// template for now :((
exports.monitor = (req, res, next) => {
    try {
        res.status(200).json({ ok: true })
    }catch (error){
        next(error)
    }
}

