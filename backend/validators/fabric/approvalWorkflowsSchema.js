const joi = require('joi')

const objectIdlike = joi.string().trim().min(1).max(128).required()

const submissionIdParam = joi.object({
    id: objectIdlike.required()
}).required()

const ROLES = ['organization_manager', 'organization_admin']

const rolesSchema = joi.string().trim().valid(...ROLES)

const createSubmission = joi.object ({
    body: joi.object({
        proposalType: joi.string().trim().min(3).max(255).required()
    }).required()
}).required()

const deleteSubmission = joi.object ({
    params: submissionIdParam
})

const submitForApproval = joi.object ({
    params: submissionIdParam,
}).required()

const approveSubmission = joi.object ({
    params: submissionIdParam,
    body: joi.object({
        approver: joi.string().trim().min(3).required(),
        remarks: joi.string().trim().required()
    }).required()
}).required()

const requestChanges = joi.object ({
    params: submissionIdParam,
    body: joi.object({
        approver: joi.string().trim().min(3).required(),
        remarks: joi.string.trim().required()
    }).required()
}).required()

const rejectSubmission = joi.object ({
    params: submissionIdParam,
    
}).required()

const resubmitSubmission = joi.object ({
    params: submissionIdParam,
}).required()

const getSubmissionById = Joi.object({
    params: submissionIdParam
});

const getSubmissionHistory = joi.object ({
    params: submissionIdParam
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