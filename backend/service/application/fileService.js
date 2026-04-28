const crypto = require('crypto');
const path = require('path');
const r2StorageDao = require('../../dao/r2StorageDao');

function sanitizeFilename(name) {
    return String(name)
        .replace(/[\\/\0]/g, '_')
        .replace(/[<>:"|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 255) || 'upload';
}

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
        const safeOriginalName = sanitizeFilename(
            path.basename(file.originalname || `upload${extension}`)
        );

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
                'original-name': safeOriginalName,
                'submission-id': String(submissionId),
                'tenant-id': String(tenantId || '')
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

    async deleteSubmissionFile({ objectKey }) {
        if (!objectKey) {
            throw new Error('objectKey is required');
        }

        await r2StorageDao.delete(objectKey);

        return {
            objectKey,
            deleted: true
        };
    }
}

module.exports = new FileService();