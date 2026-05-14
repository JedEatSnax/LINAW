const db = require('../../db/db');

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

            const [submission] = await db('submissions')
                .insert({
                    submission_id: submissionId,
                    tenant_id: tenantId,
                    owner: owner,
                    object_key: objectKey,
                    doc_hash: docHash,
                    original_file_name: originalFileName,
                    mime_type: mimeType,
                    size: size,
                    created_at: db.fn.now(),    
                    updated_at: db.fn.now()
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

            const affectedRows = await db('submissions')
                .where({
                    submission_id: submissionId,
                    owner: owner
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

            const [submission] = await db('submissions')
                .where({
                    submission_id: submissionId,
                    tenant_id: tenantId,
                    owner: owner
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
            const submission = await db('submissions')
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
            // Copilot note: submission_history table does not exist in current schema.
            // History is tracked in the Fabric chaincode, not in SQL.
            // This method is retained for API compatibility but returns empty array.
            return [];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ApprovalWorkflowDao();