const crypto = require('crypto');
const path = require('path');
const r2StorageDao = require('../../dao/r2StorageDao');

class FileService {
    async processSubmissionFile({ file, tenantId, submissionId }) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new Error('Uploaded file buffer is missing');
        }

        const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error('Unsupported file type');
        }

        const docHash = crypto
            .createHash('sha256')
            .update(file.buffer)
            .digest('hex');

        const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
        const safeOriginalName = path.basename(file.originalname || `upload${extension}`);

        const objectKey = this.buildSubmissionObjectKey({
            tenantId,
            submissionId,
            extension
        });

        await r2StorageDao.upload({
            key: objectKey,
            buffer: file.buffer,
            contentType: file.mimetype,
            metadata: {
                originalName: safeOriginalName,
                submissionId,
                tenantId: String(tenantId || '')
            }
        });

        return {
            objectKey,
            docHash,
            originalFileName: safeOriginalName,
            mimeType: file.mimetype,
            size: file.size
        };
    }

    buildSubmissionObjectKey({ tenantId, submissionId, extension }) {
        if (!tenantId) {
            throw new Error('tenantId is required for object key generation');
        }

        if (!submissionId) {
            throw new Error('submissionId is required for object key generation');
        }

        return `tenants/${tenantId}/submissions/${submissionId}/proposal${extension}`;
    }
}

module.exports = new FileService();