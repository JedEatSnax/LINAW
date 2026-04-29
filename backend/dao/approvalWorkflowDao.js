const db = require('../db/db');

class ApprovalWorkflowDao {
    async createSubmissionMetadata(data) {
        try {
            const {
                submissionId,
                tenantId,
                owner,
                objectKey,
                docHash,
                originalFileName,
                mimeType,
                size
            } = data;

            const [submission] = await db('submission')
                .insert({
                    submission_id: submissionId,
                    tenant_id: tenantId,
                    owner_id: owner,
                    object_key: objectKey,
                    doc_hash: docHash,
                    original_file_name: originalFileName,
                    mime_type: mimeType,
                    size: size,
                    created_at: db.fn.now()
                })
                .returning('*');

            return submission;
        } catch (error) {
            if (error.code === '23505') throw new Error('SUBMISSION_ALREADY_EXISTS');
            throw error;
        }
    }

    async deleteSubmission(data) {
        try {
            const { submissionId, owner } = data;

            const affectedRows = await db('submission')
                .where({
                    submission_id: submissionId,
                    owner_id: owner
                })
                .del();

            return affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    async updateSubmission(data) {
        try {
            const {
                submissionId,
                tenantId,
                owner,
                objectKey,
                docHash,
                originalFileName,
                mimeType,
                size
            } = data;

            const [submission] = await db('submission')
                .where({
                    submission_id: submissionId,
                    tenant_id: tenantId,
                    owner_id: owner
                })
                .update({
                    object_key: objectKey,
                    doc_hash: docHash,
                    original_file_name: originalFileName,
                    mime_type: mimeType,
                    size: size,
                    updated_at: db.fn.now()
                })
                .returning('*');

            return submission;
        } catch (error) {
            if (error.code === '23505') throw new Error('FAILED_TO_UPDATE_SUBMISSION');
            throw error;
        }
    }

    async getSubmissionById ({ submissionId }) {
        try {
            const submission = await db('submission')
                .select('*')
                .where({ submission_id: submissionId })
                .first();

            return submission || null;
        } catch (error) {
            throw error;
        }
    }

    async getSubmissionHistory ({ submissionId }) {
        try {
            const history = await db('submission_history')
                .select('*')
                .where({ submission_id: submissionId })
                .orderBy('created_at', 'asc');

            return history || [];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ApprovalWorkflowDao();