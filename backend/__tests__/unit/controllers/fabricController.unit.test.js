jest.mock('../../../service/application/networkAssetsService', () => ({
    networkCreate: jest.fn(),
    networkRead: jest.fn(),
    channelCreate: jest.fn(),
    channelRead: jest.fn(),
    smartContract: jest.fn(),
    contractReadAll: jest.fn(),
    createAsset: jest.fn(),
    assetTransfer: jest.fn(),
    assetUpdate: jest.fn(),
    assetDelete: jest.fn(),
    assetRead: jest.fn(),
    assetReadAll: jest.fn()
}));

jest.mock('../../../service/application/approvalWorkflowService', () => ({
    createSubmission: jest.fn(),
    submitForApproval: jest.fn(),
    approveSubmission: jest.fn(),
    rejectSubmission: jest.fn(),
    requestChanges: jest.fn(),
    resubmitSubmission: jest.fn(),
    getSubmissionById: jest.fn(),
    getSubmissionHistory: jest.fn(),
    deleteSubmission: jest.fn()
}));

const networkAssetsService = require('../../../service/application/networkAssetsService');
const approvalWorkflowService = require('../../../service/application/approvalWorkflowService');
const fabricController = require('../../../controllers/fabricController');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.location = jest.fn().mockReturnValue(res);
    return res;
}

describe('backend/controllers/fabricController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('networkCreate returns 201 and payload from service', async () => {
        networkAssetsService.networkCreate.mockResolvedValue({ id: 'n1' });

        const req = {
            body: { name: 'net' },
            user: { uid: 'u1' }
        };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.networkCreate(req, res, next);

        expect(networkAssetsService.networkCreate).toHaveBeenCalledWith({
            body: { name: 'net' },
            user: { uid: 'u1' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'n1' });
    });

    it('networkCreate forwards service error to next', async () => {
        const err = new Error('boom');
        networkAssetsService.networkCreate.mockRejectedValue(err);

        const req = { body: {}, user: { uid: 'u1' } };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.networkCreate(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('createAsset returns 201 with service payload', async () => {
        networkAssetsService.createAsset.mockResolvedValue({ id: 'asset-1' });

        const req = { body: { id: 'asset-1' }, user: { uid: 'u2' } };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.createAsset(req, res, next);

        expect(networkAssetsService.createAsset).toHaveBeenCalledWith({
            body: { id: 'asset-1' },
            user: { uid: 'u2' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'asset-1' });
        expect(next).not.toHaveBeenCalled();
    });

    it('createSubmission uses current approvalWorkflowService call and sets Location header', async () => {
        approvalWorkflowService.createSubmission.mockResolvedValue({
            submissionId: 'sub-1',
            status: 'DRAFT'
        });

        const req = {
            params: {},
            body: { proposalType: 'membership' },
            user: { uid: 'u3' },
            file: { originalname: 'proposal.pdf' }
        };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.createSubmission(req, res, next);

        expect(approvalWorkflowService.createSubmission).toHaveBeenCalledWith({
            params: {},
            body: { proposalType: 'membership' },
            user: { uid: 'u3' },
            file: { originalname: 'proposal.pdf' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.location).toHaveBeenCalledWith('/submissions/sub-1');
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                submissionId: 'sub-1',
                status: 'DRAFT'
            }
        });
    });

    it('approveSubmission uses current approvalWorkflowService method and returns 200', async () => {
        approvalWorkflowService.approveSubmission.mockResolvedValue({ status: 'APPROVED' });

        const req = {
            params: { submissionId: 'sub-2' },
            body: { remarks: 'ok' },
            user: { uid: 'approver-1' }
        };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.approveSubmission(req, res, next);

        expect(approvalWorkflowService.approveSubmission).toHaveBeenCalledWith({
            params: { submissionId: 'sub-2' },
            body: { remarks: 'ok' },
            user: { uid: 'approver-1' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: 'APPROVED' });
        expect(next).not.toHaveBeenCalled();
    });

    it('getSubmissionById wraps service response in success envelope', async () => {
        approvalWorkflowService.getSubmissionById.mockResolvedValue({ submissionId: 'sub-3' });

        const req = {
            params: { submissionId: 'sub-3' },
            user: { uid: 'u4' }
        };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.getSubmissionById(req, res, next);

        expect(approvalWorkflowService.getSubmissionById).toHaveBeenCalledWith({
            submissionId: 'sub-3',
            user: { uid: 'u4' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Submission retrieved successfully',
            data: { submissionId: 'sub-3' }
        });
    });

    it('getSubmissionById forwards service errors to next', async () => {
        const err = new Error('read failed');
        approvalWorkflowService.getSubmissionById.mockRejectedValue(err);

        const req = {
            params: { submissionId: 'sub-4' },
            user: { uid: 'u4' }
        };
        const res = makeRes();
        const next = jest.fn();

        await fabricController.getSubmissionById(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });
});
