const joi = require('joi')

const objectIdlike = joi.string().trim().min(1).max(128).required()

const submissionId = joi.object({
    submissionId: objectIdlike.required()
}).required()

const ROLES = ['organization_manager', 'organization_admin']

const rolesSchema = joi.string().trim().valid(...ROLES)

const createSubmission = joi.object ({
    body: joi.object({
        proposalType: joi.string().trim().min(3).max(255).required()
    }).required()
}).required()

const deleteSubmission = joi.object ({
    params: submissionId
})

const submitForApproval = joi.object ({
    params: submissionId,
}).required()

const approveSubmission = joi.object ({
    params: submissionId,
    body: joi.object({
        approver: joi.string().trim().min(3).required(),
        remarks: joi.string().trim().required()
    }).required()
}).required()

const requestChanges = joi.object ({
    params: submissionId,
    body: joi.object({
        approver: joi.string().trim().min(3).required(),
        remarks: joi.string().trim().required()
    }).required()
}).required()

const rejectSubmission = joi.object ({
    params: submissionId,
    
}).required()

const resubmitSubmission = joi.object ({
    params: submissionId,
}).required()

const getSubmissionById = joi.object({
    params: submissionId
});

const getSubmissionHistory = joi.object ({
    params: submissionId
})

module.exports = {
    createSubmission,
    deleteSubmission,
    submitForApproval,
    approveSubmission,
    requestChanges,
    rejectSubmission,
    resubmitSubmission,
    getSubmissionById,
    getSubmissionHistory
}