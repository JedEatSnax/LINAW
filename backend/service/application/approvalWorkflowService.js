/*
    TODO: Wii
    - [ ] Implement the error handling and logging for better debugging and monitoring in the approvalWorkflowService.js file.
    - [ ] Write unit tests for the functions in approvalWorkflowService.js to validate their functionality and reliability.
*/

const crypto = require('crypto');
const approvalWorkflowSchema = require('../../validators/fabric/approvalWorkflowsSchema');
const AppError = require('../../utils/AppError');
const approvalWorkflow = require('../fabric/approvalWorkflow');
const submissionDao = require('../../dao/chaincodeMetadata/approvalWorkflowDao');
const userDao = require('../../dao/userDao');
const fileService = require('./fileService');

class ValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class ApprovalWorkflowService {
    constructor() {
        this.schemas = approvalWorkflowSchema;
    }

    validate(schemaKey, data) {
        const schema = this.schemas[schemaKey];

        if (!schema) {
            throw new Error(`Validation schema not found for key: ${schemaKey}`);
        }

        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            throw new ValidationError(
                'Validation failed',
                error.details.map(d => d.message)
            );
        }

        return value;
    }

    async createSubmission({ body, user, file }) {
        const validated = this.validate('createSubmission', { body });
        const submissionId = `sub-${crypto.randomUUID()}`;

        const { proposalType } = validated.body;

        // Look up user_id from database using firebase_uid
        const dbUser = await userDao.findByFirebaseUid(user?.uid);
        if (!dbUser) {
            throw new AppError('User not found in database', 404, 'USER_NOT_FOUND');
        }

        const fileMeta = await fileService.processSubmissionFile({
            file,
            tenantId: user?.tenantId,
            submissionId
        });

        // Store metadata with database user_id (for SQL FK)
        await submissionDao.createSubmissionMetadata({
            submissionId,
            tenantId: user?.tenantId,
            owner: dbUser.user_id,
            objectKey: fileMeta.objectKey,
            docHash: fileMeta.docHash,
            originalFileName: fileMeta.originalFileName,
            mimeType: fileMeta.mimeType,
            size: fileMeta.size
        });

        // Pass firebase_uid to fabric service (for chaincode)
        await approvalWorkflow.createSubmission({
            submissionId,
            owner: user?.uid,
            role: user?.role,
            proposalType,
            docHash: fileMeta.docHash
        });

        return {
            submissionId,
            status: 'DRAFT',
            proposalType
        };
    }

    async deleteSubmission({ params, user }) {
        const validated = this.validate('deleteSubmission', { params });
        const submissionId = validated.params.submissionId;

        const metadata = await submissionDao.getSubmissionById({ submissionId })

        if (!metadata) {
            throw new AppError('Submission not found', 404, 'SUBMISSION_NOT_FOUND');
        }

        await approvalWorkflow.deleteSubmission({
            submissionId,
            owner: user?.uid
        });

        if (metadata?.objectKey) {
            await fileService.deleteSubmissionFile({
                objectKey: metadata.objectKey
            })
        }

        // Copilot note: Use metadata.owner (which is user_id from database) for DAO deletion
        await submissionDao.deleteSubmission({
            submissionId,
            owner: metadata.owner
        }) 

        return {
            message: 'Deleted Successfully'
        };
    }

    async submitForApproval({ params, user }) {
        const validated = this.validate('submitForApproval', { params });
        const submissionId = validated.params.submissionId;

        return await approvalWorkflow.submitForApproval({
            submissionId,
            owner: user?.uid
        });
    }

    async approveSubmission({ params, body, user }) {
        const validated = this.validate('approveSubmission', { params, body });
        const submissionId = validated.params.submissionId;
        const { remarks } = validated.body;

        return await approvalWorkflow.approveSubmission({
            submissionId,
            approver: user?.uid,
            remarks
        });
    }

    async requestChanges({ params, body, user }) {
        const validated = this.validate('requestChanges', { params, body });
        const submissionId = validated.params.submissionId;
        const { remarks } = validated.body;

        return await approvalWorkflow.requestChanges({
            submissionId,
            approver: user?.uid,
            remarks
        });
    }

    async rejectSubmission({ params, body, user }) {
        const validated = this.validate('rejectSubmission', { params, body });
        const submissionId = validated.params.submissionId;
        const { remarks } = validated.body;

        return await approvalWorkflow.rejectSubmission({
            submissionId,
            approver: user?.uid,
            remarks
        });
    }

    async resubmitSubmission({ params, body, user, file }) {
        const validated = this.validate('resubmitSubmission', { params, body });
        const submissionId = validated.params.submissionId;

        const fileMeta = await fileService.processSubmissionFile({
            file,
            tenantId: user?.tenantId,
            submissionId
        });

        await submissionDao.updateSubmission({
            submissionId,
            tenantId: user?.tenantId,
            owner: user?.uid,
            objectKey: fileMeta.objectKey,
            docHash: fileMeta.docHash,
            originalFileName: fileMeta.originalFileName,
            mimeType: fileMeta.mimeType,
            size: fileMeta.size
        });

        await approvalWorkflow.resubmitSubmission({
            submissionId,
            owner: user?.uid,
            newDocHash: fileMeta.docHash
        });

        return {
            submissionId,
            status: 'RESUBMITTED'
        };
    }

    async getSubmissionById({ params }) {
        const validated = this.validate('getSubmissionById', { params });
        const submissionId = validated.params.submissionId;

        return await approvalWorkflow.getSubmissionById({
            submissionId
        });
    }

    async getSubmissionHistory({ params }) {
        const validated = this.validate('getSubmissionHistory', { params });
        const submissionId = validated.params.submissionId;

        return await approvalWorkflow.getSubmissionHistory({
            submissionId
        });
    }
}

module.exports = new ApprovalWorkflowService();