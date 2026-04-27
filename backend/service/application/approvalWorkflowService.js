const crypto = require('crypto');
const approvalWorkflowSchema = require('../../validators/fabric/approvalWorkflowsSchema');
const AppError = require('../../utils/AppError');
const approvalWorkflow = require('../fabric/approvalWorkflow');
const submissionDao = require('../../dao/approvalWorkflowDao');
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

        const fileMeta = await fileService.processSubmissionFile({
            file,
            tenantId: user?.tenantId,
            submissionId
        });

        await submissionDao.createSubmissionMetadata({
            submissionId,
            tenantId: user?.tenantId,
            owner: user?.uid,
            objectKey: fileMeta.objectKey,
            docHash: fileMeta.docHash,
            originalFileName: fileMeta.originalFileName,
            mimeType: fileMeta.mimeType,
            size: fileMeta.size
        });

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

        await approvalWorkflow.deleteSubmission({
            submissionId,
            owner: user?.uid
        });

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