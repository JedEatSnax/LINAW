vi.mock('../../../service/application/assetRegistryService', () => ({
    createAsset: vi.fn(),
    assetTransfer: vi.fn(),
    assetUpdate: vi.fn(),
    assetDelete: vi.fn(),
    assetRead: vi.fn(),
    assetReadAll: vi.fn()
}));

const assetRegistryService = require('../../../service/application/assetRegistryService');
const assetRegistryController = require('../../../controllers/assetRegistryController');

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('backend/controllers/assetRegistryController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        assetRegistryService.createAsset = vi.fn();
        assetRegistryService.assetTransfer = vi.fn();
        assetRegistryService.assetUpdate = vi.fn();
        assetRegistryService.assetDelete = vi.fn();
        assetRegistryService.assetRead = vi.fn();
        assetRegistryService.assetReadAll = vi.fn();
    });

    it('createAsset forwards body and user to the service', async () => {
        assetRegistryService.createAsset.mockResolvedValue({ id: 'asset-1' });

        const req = {
            body: { id: 'asset-1' },
            user: { uid: 'u1', tenantId: 'tenant-1' }
        };
        const res = makeRes();
        const next = vi.fn();

        await assetRegistryController.createAsset(req, res, next);

        expect(assetRegistryService.createAsset).toHaveBeenCalledWith({
            body: { id: 'asset-1' },
            user: { uid: 'u1', tenantId: 'tenant-1' }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'asset-1' });
        expect(next).not.toHaveBeenCalled();
    });

    it('assetTransfer forwards params, body, and user to the service', async () => {
        assetRegistryService.assetTransfer.mockResolvedValue({ transferred: true });

        const req = {
            params: { id: 'asset-2' },
            body: { owner: 'bob' },
            user: { uid: 'u2', tenantId: 'tenant-2' }
        };
        const res = makeRes();
        const next = vi.fn();

        await assetRegistryController.assetTransfer(req, res, next);

        expect(assetRegistryService.assetTransfer).toHaveBeenCalledWith({
            params: { id: 'asset-2' },
            body: { owner: 'bob' },
            user: { uid: 'u2', tenantId: 'tenant-2' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ transferred: true });
    });

    it('assetReadAll forwards user to the service', async () => {
        assetRegistryService.assetReadAll.mockResolvedValue([{ id: 'asset-3' }]);

        const req = { user: { uid: 'u3', tenantId: 'tenant-3' } };
        const res = makeRes();
        const next = vi.fn();

        await assetRegistryController.assetReadAll(req, res, next);

        expect(assetRegistryService.assetReadAll).toHaveBeenCalledWith({
            user: { uid: 'u3', tenantId: 'tenant-3' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 'asset-3' }]);
    });

    it('assetRead delegates service errors to next', async () => {
        const err = new Error('asset read failed');
        assetRegistryService.assetRead.mockRejectedValue(err);

        const req = { params: { id: 'asset-4' }, user: { uid: 'u4', tenantId: 'tenant-4' } };
        const res = makeRes();
        const next = vi.fn();

        await assetRegistryController.assetRead(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.status).not.toHaveBeenCalled();
    });
});