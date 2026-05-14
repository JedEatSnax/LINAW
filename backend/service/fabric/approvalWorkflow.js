const AppError = require('../../utils/AppError.js');
const fabricGateway = require('../../config/fabric/fabricGateway.js');

function getContractFromGateway(contractName) {
    return fabricGateway.getContract(contractName);
}

function parseBuffer(resultBuffer) {
    if (!resultBuffer || resultBuffer.length === 0) {
        return null;
    }

    const resultString = resultBuffer.toString();

    try {
        return JSON.parse(resultString);
    } catch (error) {
        return resultString;
    }
}

async function submitTransactionAsync(contract, transactionName, args = []) {
    const commit = await contract.submitAsync(transactionName, {
        arguments: args,
    });

    const result = commit.getResult();

    const status = await commit.getStatus();
    if (!status.successful) {
        throw new Error(
            `Transaction ${status.transactionId} failed to commit with status code ${String(status.code)}`
        );
    }

    return parseBuffer(result);
}

class ApprovalWorkflow {
    async createSubmission({ submissionId, owner, role, proposalType, docHash, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'createSubmission', [
                submissionId,
                owner,
                role,
                'DRAFT',
                proposalType,
                docHash
            ]);

            return {
                message: 'Submission created successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to create submission',
                500,
                'FABRIC_CREATE_SUBMISSION_ERROR'
            );
        }
    }

    async deleteSubmission({ submissionId, owner, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'deleteSubmission', [
                submissionId,
                owner
            ]);

            return {
                message: 'Submission deleted successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to delete submission',
                500,
                'FABRIC_DELETE_SUBMISSION_ERROR'
            );
        }
    }

    async submitForApproval({ submissionId, owner, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'submitForApproval', [
                submissionId,
                owner
            ]);

            return {
                message: 'Submission submitted for approval successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to submit for approval',
                500,
                'FABRIC_SUBMIT_FOR_APPROVAL_ERROR'
            );
        }
    }

    async approveSubmission({ submissionId, approver, remarks, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'approveSubmission', [
                submissionId,
                approver,
                remarks
            ]);

            return {
                message: 'Submission approved successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to approve submission',
                500,
                'FABRIC_APPROVE_SUBMISSION_ERROR'
            );
        }
    }

    async rejectSubmission({ submissionId, approver, remarks, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'rejectSubmission', [
                submissionId,
                approver,
                remarks
            ]);

            return {
                message: 'Submission rejected successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to reject submission',
                500,
                'FABRIC_REJECT_SUBMISSION_ERROR'
            );
        }
    }

    async requestChanges({ submissionId, approver, remarks, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'requestChanges', [
                submissionId,
                approver,
                remarks
            ]);

            return {
                message: 'Changes requested successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to request changes',
                500,
                'FABRIC_REQUEST_CHANGES_ERROR'
            );
        }
    }

    async resubmitSubmission({ submissionId, owner, newDocHash, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const data = await submitTransactionAsync(contract, 'resubmitSubmission', [
                submissionId,
                owner,
                newDocHash
            ]);

            return {
                message: 'Submission resubmitted successfully',
                requested_by: requestedBy,
                data
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to resubmit submission',
                500,
                'FABRIC_RESUBMIT_SUBMISSION_ERROR'
            );
        }
    }

    async getSubmissionById({ submissionId, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const result = await contract.evaluateTransaction('readSubmission', submissionId);

            return {
                message: 'Submission fetched successfully',
                requested_by: requestedBy,
                data: parseBuffer(result)
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to fetch submission',
                500,
                'FABRIC_READ_SUBMISSION_ERROR'
            );
        }
    }

    async getSubmissionHistory({ submissionId, requestedBy }) {
        try {
            const contract = getContractFromGateway('approvalWorkflowContract');

            const result = await contract.evaluateTransaction('getSubmissionHistory', submissionId);

            return {
                message: 'Submission history fetched successfully',
                requested_by: requestedBy,
                data: parseBuffer(result)
            };
        } catch (error) {
            throw new AppError(
                error.message || 'Failed to fetch submission history',
                500,
                'FABRIC_GET_SUBMISSION_HISTORY_ERROR'
            );
        }
    }
}

module.exports = new ApprovalWorkflow();