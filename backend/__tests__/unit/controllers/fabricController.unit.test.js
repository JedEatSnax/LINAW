vi.mock('../../../service/application/networkAssetsService', () => ({
    networkCreate: vi.fn(),
    networkRead: vi.fn(),
    channelCreate: vi.fn(),
    channelRead: vi.fn(),
    smartContract: vi.fn(),
    contractReadAll: vi.fn()
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
        networkAssetsService.networkCreate = vi.fn();
        networkAssetsService.networkRead = vi.fn();
        networkAssetsService.channelCreate = vi.fn();
        networkAssetsService.channelRead = vi.fn();
        networkAssetsService.smartContract = vi.fn();
        networkAssetsService.contractReadAll = vi.fn();
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

    it('networkCreate rejects when req.user is missing', async () => {
        const req = { body: { name: 'net' } };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.networkCreate(req, res, next);

        expect(networkAssetsService.networkCreate).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401,
            code: 'AUTH_MISSING'
        }));
        expect(res.status).not.toHaveBeenCalled();
    });

    it('networkRead returns 200 with service payload', async () => {
        networkAssetsService.networkRead.mockResolvedValue({ id: 'network-1' });

        const req = { params: { network_id: 'network-1' }, user: { uid: 'u2' } };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.networkRead(req, res, next);

        expect(networkAssetsService.networkRead).toHaveBeenCalledWith({
            params: { network_id: 'network-1' },
            user: { uid: 'u2' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ id: 'network-1' });
    });

    it('channelCreate forwards request data to service', async () => {
        networkAssetsService.channelCreate.mockResolvedValue({ id: 'channel-1' });

        const req = {
            params: { id: 'network-1' },
            body: { name: 'main-channel' },
            user: { uid: 'u3' }
        };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.channelCreate(req, res, next);

        expect(networkAssetsService.channelCreate).toHaveBeenCalledWith({
            params: { id: 'network-1' },
            body: { name: 'main-channel' },
            user: { uid: 'u3' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'channel-1' });
    });

    it('smartContract forwards request data to service', async () => {
        networkAssetsService.smartContract.mockResolvedValue({ id: 'contract-1' });

        const req = {
            params: { channel_id: 'channel-1' },
            body: { contractType: 'approval', contractName: 'approval-contract', version: '1' },
            user: { uid: 'u4' }
        };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.smartContract(req, res, next);

        expect(networkAssetsService.smartContract).toHaveBeenCalledWith({
            params: { channel_id: 'channel-1' },
            body: { contractType: 'approval', contractName: 'approval-contract', version: '1' },
            user: { uid: 'u4' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'contract-1' });
    });

    it('contractReadAll returns 200 with service payload', async () => {
        networkAssetsService.contractReadAll.mockResolvedValue([{ id: 'contract-1' }]);

        const req = {
            params: { channel_id: 'channel-1' },
            user: { uid: 'u5' }
        };
        const res = makeRes();
        const next = vi.fn();

        await fabricController.contractReadAll(req, res, next);

        expect(networkAssetsService.contractReadAll).toHaveBeenCalledWith({
            params: { channel_id: 'channel-1' },
            user: { uid: 'u5' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 'contract-1' }]);
    });

});
