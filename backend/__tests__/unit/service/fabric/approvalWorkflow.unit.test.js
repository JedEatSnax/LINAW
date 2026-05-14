process.env.FABRIC_MSP_ID ||= 'Org1MSP';
process.env.FABRIC_CHANNEL_NAME ||= 'test-channel';
process.env.FABRIC_CHAINCODE_NAME ||= 'test-chaincode';
process.env.FABRIC_PEER_ENDPOINT ||= 'localhost:7051';
process.env.FABRIC_PEER_HOST_ALIAS ||= 'peer0.org1.example.com';
process.env.FABRIC_CERT_PATH ||= '/tmp/cert.pem';
process.env.FABRIC_KEY_DIRECTORY_PATH ||= '/tmp/keystore';
process.env.FABRIC_TLS_CERT_PATH ||= '/tmp/tls.pem';

const fabricGateway = require('../../../../config/fabric/fabricGateway.js');
let getContractMock;

vi.mock('../../../../config/fabric/fabricConfig.js', () => ({
    msp_id: 'Org1MSP',
    channel_name: 'test-channel',
    chaincode_name: 'test-chaincode',
    peer_endpoint: 'localhost:7051',
    peer_host_alias: 'peer0.org1.example.com',
    crypto_path: null,
    cert_path: '/tmp/cert.pem',
    key_directory_path: '/tmp/keystore',
    tls_cert_path: '/tmp/tls.pem'
}));

const getContract = fabricGateway.getContract;
const AppError = require('../../../../utils/AppError.js');
const approvalWorkflowService = require('../../../../service/fabric/approvalWorkflow.js');
const { toBuffer } = require('../../../helpers/fabricResultHelpers.js');

describe('backend/service/fabric/approvalWorkflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getContractMock = vi.spyOn(fabricGateway, 'getContract');
    });

    function makeCommit(result, status = { successful: true, transactionId: 'tx-1', code: 0 }) {
        return {
            getResult: vi.fn(() => toBuffer(result)),
            getStatus: vi.fn().mockResolvedValue(status)
        };
    }

    it('createSubmission calls submitAsync with mapped arguments', async () => {
        const contract = {
            submitAsync: vi.fn().mockResolvedValue(makeCommit({ id: 'sub-1' }))
        };
        getContractMock.mockReturnValue(contract);

        const result = await approvalWorkflowService.createSubmission({
            submissionId: 'sub-1',
            owner: 'owner-1',
            role: 'organization_manager',
            proposalType: 'membership',
            docHash: 'hash-1',
            requestedBy: 'uid-1'
        });

        expect(getContractMock).toHaveBeenCalledWith('approvalWorkflowContract');
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
            submitAsync: vi.fn().mockResolvedValue(
                makeCommit(
                    null,
                    { successful: false, transactionId: 'tx-2', code: 500 }
                )
            )
        };
        getContractMock.mockReturnValue(contract);

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
            submitAsync: vi.fn().mockResolvedValue(makeCommit({ status: 'APPROVED' }))
        };
        getContractMock.mockReturnValue(contract);

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
            evaluateTransaction: vi.fn().mockResolvedValue(toBuffer({ submissionId: 'sub-4' }))
        };
        getContractMock.mockReturnValue(contract);

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
            evaluateTransaction: vi.fn().mockRejectedValue(new Error('fabric failed'))
        };
        getContractMock.mockReturnValue(contract);

        await expect(
            approvalWorkflowService.getSubmissionHistory({
                submissionId: 'sub-5',
                requestedBy: 'uid-5'
            })
        ).rejects.toThrow('fabric failed');

        await expect(
            approvalWorkflowService.getSubmissionHistory({
                submissionId: 'sub-5',
                requestedBy: 'uid-5'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            statusCode: 500,
            code: 'FABRIC_GET_SUBMISSION_HISTORY_ERROR'
        });
    });
});
