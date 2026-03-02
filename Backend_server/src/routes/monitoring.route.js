// const express = require('express')
// const router = express.Router()
// const networkLevel = require('../controller/monitoring.networkLevel.controller')
// const nodeLevel = require('../controller/monitoring.nodeLevel.controller')
// const auditLogs = require('../controller/monitoring.auditLogs.controller')

// // network-level monitoring
// /*
//     so from my own understanding nung nakakita ako ng mga examples codes sa 
//     lahat ng may mga monitoring ganito talaga yung nagiging labas ng api design
//     di ko maipaliwanag bakit pero mukang reason why ganito naming scheme ng api endpoint
// */

// router.get('/networks/{networkId}/health', networkLevel.networkHealth)
// router.get('/networks/{networkId}/alerts', networkLevel.networkAlerts) // suggestions lng to iwan ko lng kung sakaling need natin
// router.get('/networks/{networkId}/metrics', networkLevel.networkMetircs) // endpoint to para sa prometheus. though wala pakong idea paano implement un iwan ko nalang muna dito

// // node-level monitoring

// /*
//     so basically mula sa pag kakaintindi ko tong node level monitoring is 
//     checks kung kumusta na yung node in terms of hardware level kung nauubusan
//     ba eto ng ram, cpu or storage. Eto lng pinaka nakuha ko sa kakasearch ko 
//     compared sa chatgpt at perplexity.
// */

// router.get('/nodes/{nodeId}/health', nodeLevel.nodeHealth)
// router.get('/nodes/{nodeId}/logs', nodeLevel.nodeLogs)
// router.get('/nodes/{nodeId}/metrics', nodeLevel.nodeMetrics)

// // Audit / immutable logs

// /* 
//     mula sa endless googling ko nakahanap ako ng isang uri ng db na 
//     parang blockchain na legit di nadedelete di nababago once entered na 
//     yung data, yung immuDB nakita ko magandang tulong to sa security side din
//     yung mga api endpoints na to wala suko nako mag isip ng mga endpoints 
//     at medj pointless yung mga nakikita kong code examples di note worthy
//     so yepp perplexity pro na tong audit api endpoints na to.
// */

// router.get('/audit?networkId=...&from=...&to=...', auditLogs.auditNetwork)
// router.get('/audit/events?from=...&to=...&actorUserId=...&action=...&resourceType=...&resourceId=...', auditLogs.auditlogsEvents)
// router.get('/users/{id}/activity', auditLogs.auditActivity)

// module.exports = {router};
