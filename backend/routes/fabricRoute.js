const express = require('express')
const router = express.Router()
const fabricController = require('../controllers/fabricController')
const authenticate = require ('../middleware/authenticate')
const { apiLimiter } = require('../middleware/rateLimiter')

router.use( apiLimiter, authenticate.decodeToken)

//blockchain 
router.post('/networks', fabricController.networkCreate)

router.post('/networks/:id/channels', fabricController.channelCreate)

router.post('/channel/:channel_id/contracts', fabricController.smartContract)
router.get ('/channel/:channel_id/contracts', fabricController.contractReadAll)

// idk what to categorize this part 

router.post     ('/organizations/:organizationId/members', fabricController.addMember)
router.patch    ('/organizations/:organizationId/members/:userId', fabricController.updateMemberRole)
router.get      ('/organizations/:organizationId/members', fabricController.getOrganizationMemebrs)
router.delete   ('/organizations/:organizationId/member/:userId', fabricController.deleteMember)

// asset registry
router.post('/assets', fabricController.createAsset)
router.post('/assets/:id/transfer', fabricController.assetTransfer)
router.put ('/assets/:id', fabricController.assetUpdate)
router.delete ('/assets/:id', fabricController.assetDelete)
router.get ('/assets/:id', fabricController.assetRead)
router.get ('/assets', fabricController.assetReadAll)

// approval workflow

router.post   ('/submissions', fabricController.createSubmission)
router.post   ('/submissions/:submissionId/submit', fabricController.submitForApproval)
router.patch  ('/submissions/:submissionId/approve', fabricController.approveSubmission)
router.patch  ('/submissions/:submissionId/reject', fabricController.rejectSubmission)
router.patch  ('/submissions/:submissionId/request-changes', fabricController.requestChanges)
router.patch  ('/submissions/:submissionId/resubmit', fabricController.resubmitSubmission)
router.get    ('/submissions/:submissionId', fabricController.getSubmissionById)
router.get    ('/submissions/:submissionId/history', fabricController.getSubmissionHistory)
router.delete ('/submissions/:submissionId', fabricController.deleteSubmission)

// accounting contract

    
module.exports = {router};