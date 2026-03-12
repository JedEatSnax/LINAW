const express = require('express')
const router = express.Router()
const networkController = require('../controllers/networkController')

router.post('/network', networkController.createNetwork)
router.get('/network/:id', networkController.monitor)

// TODO:
// Network (blockchain creation + config)
//    - POST /api/networks (create network + start provision job)
//    - GET /api/networks
//    - GET /api/networks/{networkId}
//    - PATCH /api/networks/{networkId} (update desired spec → start reconcile job)
//    - DELETE /api/networks/{networkId} (teardown job; optional)
// - Nodes (inventory/status):
//    - GET /api/networks/{networkId}/nodes
//    - GET /api/nodes/{nodeId}
// - Channels:
//    - POST /api/networks/{networkId}/channels (create channel → returns jobId)
//    - GET /api/networks/{networkId}/channels
//    - GET /api/channels/{channelId}
//    - POST /api/channels/{channelId}/join (join peers → job)
//    - POST /api/channels/{channelId}/members (add orgs → job)
// - Job (Async operation):
//    - GET /api/jobs/{jobId}
//    - GET /api/networks/{networkId}/jobs
// Authorization middleware


module.exports = {router};