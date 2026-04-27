jest.mock('../../../../config/fabric/fabricGateway.js', () => ({
    getContract: jest.fn()
}));

const { getContract } = require('../../../../config/fabric/fabricGateway.js');
const AppError = require('../../../../utils/AppError.js');
const approvalWorkflowService = require('../../../../service/fabric/approvalWorkflow.js');
const { toBuffer } = require('../../../helpers/fabricResultHelpers.js');

describe('backend/service/fabric/approvalWorkflow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function makeCommit(result, status = { successful: true, transactionId: 'tx-1', code: 0 }) {
        return {
            getResult: jest.fn(() => toBuffer(result)),
            getStatus: jest.fn().mockResolvedValue(status)
        };
    }

    it('createSubmission calls submitAsync with mapped arguments', async () => {
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(makeCommit({ id: 'sub-1' }))
        };
        getContract.mockReturnValue(contract);

        const result = await approvalWorkflowService.createSubmission({
            submissionId: 'sub-1',
            owner: 'owner-1',
            role: 'organization_manager',
            proposalType: 'membership',
            docHash: 'hash-1',
            requestedBy: 'uid-1'
        });

        expect(getContract).toHaveBeenCalledWith('approvalWorkflowContract');
        expect(contract.submitAsync).toHaveBeenCalledWith('createSubmission', {
            arguments: ['sub-1', 'owner-1', 'organization_manager', 'DRAFT', 'membership', 'hash-1']
        });
        expect(result).toEqual({
            message: 'Submission created successfully',
            requested_by: 'uid-1',
            data: { id: 'sub-1' }
        });
    });

    it('submitForApproval wraps failed commit status as AppError', async () => {
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(
                makeCommit(
                    null,
                    { successful: false, transactionId: 'tx-2', code: 500 }
                )
            )
        };
        getContract.mockReturnValue(contract);

        await expect(
            approvalWorkflowService.submitForApproval({
                submissionId: 'sub-2',
                owner: 'owner-2',
                requestedBy: 'uid-2'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            statusCode: 500,
            code: 'FABRIC_SUBMIT_FOR_APPROVAL_ERROR'
        });
    });

    it('approveSubmission sends approver and remarks to submitAsync', async () => {
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(makeCommit({ status: 'APPROVED' }))
        };
        getContract.mockReturnValue(contract);

        const result = await approvalWorkflowService.approveSubmission({
            submissionId: 'sub-3',
            approver: 'approver-1',
            remarks: 'ok',
            requestedBy: 'uid-3'
        });

        expect(contract.submitAsync).toHaveBeenCalledWith('approveSubmission', {
            arguments: ['sub-3', 'approver-1', 'ok']
        });
        expect(result.data).toEqual({ status: 'APPROVED' });
    });

    it('getSubmissionById reads contract and parses buffer response', async () => {
        const contract = {
            evaluateTransaction: jest.fn().mockResolvedValue(toBuffer({ submissionId: 'sub-4' }))
        };
        getContract.mockReturnValue(contract);

        const result = await approvalWorkflowService.getSubmissionById({
            submissionId: 'sub-4',
            requestedBy: 'uid-4'
        });

        expect(contract.evaluateTransaction).toHaveBeenCalledWith('readSubmission', 'sub-4');
        expect(result).toEqual({
            message: 'Submission fetched successfully',
            requested_by: 'uid-4',
            data: { submissionId: 'sub-4' }
        });
    });

    it('getSubmissionHistory wraps evaluation errors as AppError', async () => {
        const contract = {
            evaluateTransaction: jest.fn().mockRejectedValue(new Error('fabric failed'))
        };
        getContract.mockReturnValue(contract);

        await expect(
            approvalWorkflowService.getSubmissionHistory({
                submissionId: 'sub-5',
                requestedBy: 'uid-5'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            message: 'fabric failed',
            statusCode: 500,
            code: 'FABRIC_GET_SUBMISSION_HISTORY_ERROR'
        });
    });
});
