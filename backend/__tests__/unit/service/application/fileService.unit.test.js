jest.mock('../../../../dao/r2StorageDao', () => ({
    upload: jest.fn()
}), { virtual: true });

const crypto = require('crypto');
const r2StorageDao = require('../../../../dao/r2StorageDao');
const fileService = require('../../../../service/application/fileService');

describe('backend/service/application/fileService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('processSubmissionFile uploads supported file and returns metadata', async () => {
        r2StorageDao.upload.mockResolvedValue(undefined);

        const file = {
            buffer: Buffer.from('hello world'),
            mimetype: 'application/pdf',
            originalname: '../../proposal.PDF',
            size: 11
        };

        const result = await fileService.processSubmissionFile({
            file,
            tenantId: 'tenant-1',
            submissionId: 'sub-1'
        });

        const expectedHash = crypto
            .createHash('sha256')
            .update(file.buffer)
            .digest('hex');

        expect(r2StorageDao.upload).toHaveBeenCalledWith({
            key: 'tenants/tenant-1/submissions/sub-1/proposal.pdf',
            buffer: file.buffer,
            contentType: 'application/pdf',
            metadata: {
                originalName: 'proposal.PDF',
                submissionId: 'sub-1',
                tenantId: 'tenant-1'
            }
        });

        expect(result).toEqual({
            objectKey: 'tenants/tenant-1/submissions/sub-1/proposal.pdf',
            docHash: expectedHash,
            originalFileName: 'proposal.PDF',
            mimeType: 'application/pdf',
            size: 11
        });
    });

    it('processSubmissionFile throws when file is missing', async () => {
        await expect(
            fileService.processSubmissionFile({
                file: undefined,
                tenantId: 'tenant-1',
                submissionId: 'sub-1'
            })
        ).rejects.toThrow('No file uploaded');

        expect(r2StorageDao.upload).not.toHaveBeenCalled();
    });

    it('processSubmissionFile throws when file buffer is invalid', async () => {
        await expect(
            fileService.processSubmissionFile({
                file: {
                    buffer: 'not-a-buffer',
                    mimetype: 'application/pdf',
                    originalname: 'proposal.pdf',
                    size: 1
                },
                tenantId: 'tenant-1',
                submissionId: 'sub-1'
            })
        ).rejects.toThrow('Uploaded file buffer is missing');

        expect(r2StorageDao.upload).not.toHaveBeenCalled();
    });

    it('processSubmissionFile throws when file type is unsupported', async () => {
        await expect(
            fileService.processSubmissionFile({
                file: {
                    buffer: Buffer.from('abc'),
                    mimetype: 'image/png',
                    originalname: 'proposal.png',
                    size: 3
                },
                tenantId: 'tenant-1',
                submissionId: 'sub-1'
            })
        ).rejects.toThrow('Unsupported file type');

        expect(r2StorageDao.upload).not.toHaveBeenCalled();
    });

    it('buildSubmissionObjectKey throws when tenantId is missing', () => {
        expect(() =>
            fileService.buildSubmissionObjectKey({
                tenantId: '',
                submissionId: 'sub-1',
                extension: '.pdf'
            })
        ).toThrow('tenantId is required for object key generation');
    });

    it('buildSubmissionObjectKey throws when submissionId is missing', () => {
        expect(() =>
            fileService.buildSubmissionObjectKey({
                tenantId: 'tenant-1',
                submissionId: '',
                extension: '.pdf'
            })
        ).toThrow('submissionId is required for object key generation');
    });

    it('buildSubmissionObjectKey builds expected key', () => {
        expect(
            fileService.buildSubmissionObjectKey({
                tenantId: 'tenant-1',
                submissionId: 'sub-1',
                extension: '.docx'
            })
        ).toBe('tenants/tenant-1/submissions/sub-1/proposal.docx');
    });
});
