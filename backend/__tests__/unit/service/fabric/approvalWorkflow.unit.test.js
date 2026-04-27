jest.mock('../../../../config/fabric/fabricGateway.js', () => ({
    getContract: jest.fn()
}));

const approvalWorkflowService = require('../../../../service/fabric/approvalWorkflow.js');

describe('backend/service/fabric/approvalWorkflow', () => {
    it('currently has no exported implementation yet', () => {
        expect(approvalWorkflowService).toEqual({});
    });

    test.todo('createSubmission: should call getContract(\'ApprovalWorkflowContract\') and submitTransaction with mapped args');
    test.todo('submitForApproval: should call getContract(\'ApprovalWorkflowContract\') and submitTransaction');
    test.todo('approveSubmission: should call getContract(\'ApprovalWorkflowContract\') and submitTransaction');
    test.todo('rejectSubmission: should call getContract(\'ApprovalWorkflowContract\') and submitTransaction');
    test.todo('getSubmissionHistory: should call getContract(\'ApprovalWorkflowContract\') and evaluateTransaction');
    test.todo('all methods should propagate gateway/contract failures as AppError');
});
