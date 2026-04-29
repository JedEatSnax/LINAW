vi.mock('../../../../validators/fabric/approvalWorkflowsSchema');
vi.mock('../../../../dao/approvalWorkflowDao');
vi.mock('../../../../service/application/fileService');
vi.mock('../../../../service/fabric/approvalWorkflow');

const crypto = require('crypto');
const schemas = require('../../../../validators/fabric/approvalWorkflowsSchema');
const submissionDao = require('../../../../dao/approvalWorkflowDao');
const fileService = require('../../../../service/application/fileService');
const approvalWorkflow = require('../../../../service/fabric/approvalWorkflow');
const approvalWorkflowService = require('../../../../service/application/approvalWorkflowService');

describe('backend/service/application/approvalWorkflowService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Set up schema mocks
        schemas.createSubmission = { validate: vi.fn() };
        schemas.deleteSubmission = { validate: vi.fn() };
        schemas.submitForApproval = { validate: vi.fn() };
        schemas.approveSubmission = { validate: vi.fn() };
        schemas.requestChanges = { validate: vi.fn() };
        schemas.rejectSubmission = { validate: vi.fn() };
        schemas.resubmitSubmission = { validate: vi.fn() };
        schemas.getSubmissionById = { validate: vi.fn() };
        schemas.getSubmissionHistory = { validate: vi.fn() };
        
        // Set up dao mocks
        submissionDao.createSubmissionMetadata = vi.fn();
        submissionDao.updateSubmission = vi.fn();
        submissionDao.getSubmissionById = vi.fn();
        submissionDao.deleteSubmission = vi.fn();
        submissionDao.getSubmissionHistory = vi.fn();
        
        // Set up file service mocks
        fileService.processSubmissionFile = vi.fn();
        fileService.deleteSubmissionFile = vi.fn();
        
        // Set up workflow mocks
        approvalWorkflow.createSubmission = vi.fn();
        approvalWorkflow.deleteSubmission = vi.fn();
        approvalWorkflow.submitForApproval = vi.fn();
        approvalWorkflow.approveSubmission = vi.fn();
        approvalWorkflow.requestChanges = vi.fn();
        approvalWorkflow.rejectSubmission = vi.fn();
        approvalWorkflow.resubmitSubmission = vi.fn();
        approvalWorkflow.getSubmissionById = vi.fn();
        approvalWorkflow.getSubmissionHistory = vi.fn();

        // Set default validation implementations
        schemas.createSubmission.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.deleteSubmission.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.submitForApproval.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.approveSubmission.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.requestChanges.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.rejectSubmission.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.resubmitSubmission.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.getSubmissionById.validate.mockImplementation((input) => ({ error: null, value: input }));
        schemas.getSubmissionHistory.validate.mockImplementation((input) => ({ error: null, value: input }));
    });

    it('validate throws when schema key does not exist', () => {
        expect(() => approvalWorkflowService.validate('missing', {})).toThrow(
            'Validation schema not found for key: missing'
        );
    });

    it('createSubmission validates input and coordinates file + DAO + workflow calls', async () => {
        vi.spyOn(crypto, 'randomUUID').mockReturnValue('fixed-uuid');

        fileService.processSubmissionFile.mockResolvedValue({
            objectKey: 'obj-1',
            docHash: 'hash-1',
            originalFileName: 'proposal.pdf',
            mimeType: 'application/pdf',
            size: 10
        });
        submissionDao.createSubmissionMetadata.mockResolvedValue(undefined);
        approvalWorkflow.createSubmission.mockResolvedValue({ ok: true });

        const result = await approvalWorkflowService.createSubmission({
            body: { proposalType: 'membership-request' },
            user: { uid: 'u-1', role: 'organization_manager', tenantId: 'tenant-1' },
            file: { buffer: Buffer.from('a'), mimetype: 'application/pdf', originalname: 'proposal.pdf' }
        });

        expect(fileService.processSubmissionFile).toHaveBeenCalledWith({
            file: { buffer: Buffer.from('a'), mimetype: 'application/pdf', originalname: 'proposal.pdf' },
            tenantId: 'tenant-1',
            submissionId: 'sub-fixed-uuid'
        });

        expect(submissionDao.createSubmissionMetadata).toHaveBeenCalledWith({
            submissionId: 'sub-fixed-uuid',
            tenantId: 'tenant-1',
            owner: 'u-1',
            objectKey: 'obj-1',
            docHash: 'hash-1',
            originalFileName: 'proposal.pdf',
            mimeType: 'application/pdf',
            size: 10
        });

        expect(approvalWorkflow.createSubmission).toHaveBeenCalledWith({
            submissionId: 'sub-fixed-uuid',
            owner: 'u-1',
            role: 'organization_manager',
            proposalType: 'membership-request',
            docHash: 'hash-1'
        });

        expect(result).toEqual({
            submissionId: 'sub-fixed-uuid',
            status: 'DRAFT',
            proposalType: 'membership-request'
        });
    });

    it('createSubmission throws ValidationError and does not call dependencies on invalid body', async () => {
        schemas.createSubmission.validate.mockReturnValue({
            error: {
                details: [{ message: '"proposalType" is required' }]
            }
        });

        await expect(
            approvalWorkflowService.createSubmission({
                body: {},
                user: { uid: 'u-1', tenantId: 'tenant-1' },
                file: { buffer: Buffer.from('a') }
            })
        ).rejects.toMatchObject({
            name: 'ValidationError',
            message: 'Validation failed',
            statusCode: 400,
            details: ['"proposalType" is required']
        });

        expect(fileService.processSubmissionFile).not.toHaveBeenCalled();
        expect(submissionDao.createSubmissionMetadata).not.toHaveBeenCalled();
        expect(approvalWorkflow.createSubmission).not.toHaveBeenCalled();
    });

    it('approveSubmission maps params/body/user to workflow dependency', async () => {
        approvalWorkflow.approveSubmission.mockResolvedValue({ status: 'APPROVED' });

        const result = await approvalWorkflowService.approveSubmission({
            params: { submissionId: 'sub-1' },
            body: { remarks: 'looks good' },
            user: { uid: 'approver-1' }
        });

        expect(approvalWorkflow.approveSubmission).toHaveBeenCalledWith({
            submissionId: 'sub-1',
            approver: 'approver-1',
            remarks: 'looks good'
        });
        expect(result).toEqual({ status: 'APPROVED' });
    });

    it('requestChanges maps params/body/user to workflow dependency', async () => {
        approvalWorkflow.requestChanges.mockResolvedValue({ status: 'CHANGES_REQUESTED' });

        const result = await approvalWorkflowService.requestChanges({
            params: { submissionId: 'sub-1' },
            body: { remarks: 'fix section 2' },
            user: { uid: 'approver-2' }
        });

        expect(approvalWorkflow.requestChanges).toHaveBeenCalledWith({
            submissionId: 'sub-1',
            approver: 'approver-2',
            remarks: 'fix section 2'
        });
        expect(result).toEqual({ status: 'CHANGES_REQUESTED' });
    });

    it('resubmitSubmission updates metadata and sends new hash to workflow', async () => {
        fileService.processSubmissionFile.mockResolvedValue({
            objectKey: 'obj-2',
            docHash: 'hash-2',
            originalFileName: 'proposal-v2.pdf',
            mimeType: 'application/pdf',
            size: 20
        });
        submissionDao.updateSubmission.mockResolvedValue(undefined);
        approvalWorkflow.resubmitSubmission.mockResolvedValue({ ok: true });

        const result = await approvalWorkflowService.resubmitSubmission({
            params: { submissionId: 'sub-2' },
            body: {},
            user: { uid: 'u-2', tenantId: 'tenant-2' },
            file: { buffer: Buffer.from('v2'), mimetype: 'application/pdf', originalname: 'proposal-v2.pdf' }
        });

        expect(submissionDao.updateSubmission).toHaveBeenCalledWith({
            submissionId: 'sub-2',
            tenantId: 'tenant-2',
            owner: 'u-2',
            objectKey: 'obj-2',
            docHash: 'hash-2',
            originalFileName: 'proposal-v2.pdf',
            mimeType: 'application/pdf',
            size: 20
        });

        expect(approvalWorkflow.resubmitSubmission).toHaveBeenCalledWith({
            submissionId: 'sub-2',
            owner: 'u-2',
            newDocHash: 'hash-2'
        });

        expect(result).toEqual({
            submissionId: 'sub-2',
            status: 'RESUBMITTED'
        });
    });

    it('submitForApproval delegates with validated params and user', async () => {
        approvalWorkflow.submitForApproval.mockResolvedValue({ status: 'PENDING' });

        const result = await approvalWorkflowService.submitForApproval({
            params: { submissionId: 'sub-3' },
            user: { uid: 'u-3' }
        });

        expect(approvalWorkflow.submitForApproval).toHaveBeenCalledWith({
            submissionId: 'sub-3',
            owner: 'u-3'
        });
        expect(result).toEqual({ status: 'PENDING' });
    });

    it('deleteSubmission delegates and returns service response', async () => {
        approvalWorkflow.deleteSubmission.mockResolvedValue({ message: 'deleted' });
        submissionDao.getSubmissionById.mockResolvedValue({ objectKey: 'obj-4' });
        fileService.deleteSubmissionFile.mockResolvedValue({ deleted: true });

        const result = await approvalWorkflowService.deleteSubmission({
            params: { submissionId: 'sub-4' },
            user: { uid: 'u-4' }
        });

        expect(submissionDao.getSubmissionById).toHaveBeenCalledWith({ submissionId: 'sub-4' });
        expect(approvalWorkflow.deleteSubmission).toHaveBeenCalledWith({
            submissionId: 'sub-4',
            owner: 'u-4'
        });
        expect(fileService.deleteSubmissionFile).toHaveBeenCalledWith({ objectKey: 'obj-4' });
        expect(submissionDao.deleteSubmission).toHaveBeenCalledWith({ submissionId: 'sub-4' });
        expect(result).toEqual({ message: 'Deleted Successfully' });
    });

    it('getSubmissionById and getSubmissionHistory delegate to workflow', async () => {
        approvalWorkflow.getSubmissionById.mockResolvedValue({ id: 'sub-5' });
        approvalWorkflow.getSubmissionHistory.mockResolvedValue([{ status: 'DRAFT' }]);

        const one = await approvalWorkflowService.getSubmissionById({
            params: { submissionId: 'sub-5' }
        });
        const history = await approvalWorkflowService.getSubmissionHistory({
            params: { submissionId: 'sub-5' }
        });

        expect(approvalWorkflow.getSubmissionById).toHaveBeenCalledWith({
            submissionId: 'sub-5'
        });
        expect(approvalWorkflow.getSubmissionHistory).toHaveBeenCalledWith({
            submissionId: 'sub-5'
        });
        expect(one).toEqual({ id: 'sub-5' });
        expect(history).toEqual([{ status: 'DRAFT' }]);
    });
});
