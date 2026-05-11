vi.mock('../../../service/application/networkAssetsService', () => ({
    networkCreate: vi.fn(),
    networkRead: vi.fn(),
    channelCreate: vi.fn(),
    channelRead: vi.fn(),
    smartContract: vi.fn(),
    contractReadAll: vi.fn(),
    createAsset: vi.fn(),
    assetTransfer: vi.fn(),
    assetUpdate: vi.fn(),
    assetDelete: vi.fn(),
    assetRead: vi.fn(),
    assetReadAll: vi.fn()
}));
vi.mock('../../../service/application/approvalWorkflowService', () => ({
    createSubmission: vi.fn(),
    submitForApproval: vi.fn(),
    approveSubmission: vi.fn(),
    rejectSubmission: vi.fn(),
    requestChanges: vi.fn(),
    resubmitSubmission: vi.fn(),
    getSubmissionById: vi.fn(),
    getSubmissionHistory: vi.fn(),
    deleteSubmission: vi.fn()
}));
vi.mock('../../../dao/r2StorageDao', () => ({
    upload: vi.fn(),
    deleteObject: vi.fn(),
    getSignedUrl: vi.fn()
}));

const networkAssetsService = require('../../../service/application/networkAssetsService');
const fabricController = require('../../../controllers/blockchainController');

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.location = vi.fn().mockReturnValue(res);
    return res;
}

describe('backend/controllers/fabricController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set up networkAssetsService mocks
        networkAssetsService.networkCreate = vi.fn();
        networkAssetsService.networkRead = vi.fn();
        networkAssetsService.channelCreate = vi.fn();
        networkAssetsService.channelRead = vi.fn();
        networkAssetsService.smartContract = vi.fn();
        networkAssetsService.contractReadAll = vi.fn();
        networkAssetsService.createAsset = vi.fn();
        networkAssetsService.assetTransfer = vi.fn();
        networkAssetsService.assetUpdate = vi.fn();
        networkAssetsService.assetDelete = vi.fn();
        networkAssetsService.assetRead = vi.fn();
        networkAssetsService.assetReadAll = vi.fn();
    });

    it('networkCreate returns 201 and payload from service', async () => {
        networkAssetsService.networkCreate.mockResolvedValue({ id: 'n1' });

        const req = {
            body: { name: 'net' },
            user: { uid: 'u1' }
        };
        const res = makeRes();
        const next = vi.fn();

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
        const next = vi.fn();

        await fabricController.networkCreate(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('createAsset returns 201 with service payload', async () => {
        networkAssetsService.createAsset.mockResolvedValue({ id: 'asset-1' });

        const req = { body: { id: 'asset-1' }, user: { uid: 'u2' } };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.createAsset(req, res, next);

        expect(networkAssetsService.createAsset).toHaveBeenCalledWith({
            body: { id: 'asset-1' },
            user: { uid: 'u2' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'asset-1' });
        expect(next).not.toHaveBeenCalled();
    });

    it('assetReadAll returns 200 with service payload', async () => {
        networkAssetsService.assetReadAll.mockResolvedValue([{ id: 'asset-1' }]);

        const req = { user: { uid: 'u2', tenantId: 'tenant-1' } };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.assetReadAll(req, res, next);

        expect(networkAssetsService.assetReadAll).toHaveBeenCalledWith({
            user: { uid: 'u2', tenantId: 'tenant-1' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 'asset-1' }]);
        expect(next).not.toHaveBeenCalled();
    });

    it('assetTransfer forwards request data to service', async () => {
        networkAssetsService.assetTransfer.mockResolvedValue({ transferred: true });

        const req = {
            params: { id: 'asset-1' },
            body: { owner: 'bob' },
            user: { uid: 'u3', tenantId: 'tenant-2' }
        };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.assetTransfer(req, res, next);

        expect(networkAssetsService.assetTransfer).toHaveBeenCalledWith({
            params: { id: 'asset-1' },
            body: { owner: 'bob' },
            user: { uid: 'u3', tenantId: 'tenant-2' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ transferred: true });
    });

});
