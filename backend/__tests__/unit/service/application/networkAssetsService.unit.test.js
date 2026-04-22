jest.mock('../../../../service/fabric/assetRegistry.js', () => ({
    createAsset: jest.fn()
}));

const networkAssetsService = require('../../../../service/application/networkAssetsService.js');
const assetService = require('../../../../service/fabric/assetRegistry.js');

describe('backend/service/application/networkAssetsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createAsset validates payload and passes requestedBy through', async () => {
        assetService.createAsset.mockResolvedValue({ ok: true });

        const body = {
            id: 'asset-200',
            color: 'green',
            size: 42,
            owner: 'alice',
            appraisedValue: 1550,
            ignoredField: 'should-be-removed'
        };

        const result = await networkAssetsService.createAsset({
            body,
            user: { uid: 'firebase-uid-1' }
        });

        expect(assetService.createAsset).toHaveBeenCalledWith({
            id: 'asset-200',
            color: 'green',
            size: 42,
            owner: 'alice',
            appraisedValue: 1550,
            requestedBy: 'firebase-uid-1'
        });
        expect(result).toEqual({ ok: true });
    });

    it('createAsset throws validation error for invalid payload', async () => {
        await expect(
            networkAssetsService.createAsset({
                body: {
                    id: 'asset-200',
                    color: 'green',
                    size: 42,
                    owner: 'alice'
                },
                user: { uid: 'firebase-uid-1' }
            })
        ).rejects.toMatchObject({
            name: 'ValidationError',
            message: 'Validation failed',
            statusCode: 400
        });

        expect(assetService.createAsset).not.toHaveBeenCalled();
    });

    it('documents currently missing submission workflow methods', () => {
        expect(typeof networkAssetsService.createSubmission).toBe('undefined');
        expect(typeof networkAssetsService.submitForApproval).toBe('undefined');
        expect(typeof networkAssetsService.approveSubmission).toBe('undefined');
        expect(typeof networkAssetsService.rejectSubmission).toBe('undefined');
    });

    test.todo('createSubmission service: validate payload and pass requestedBy to fabric integration service');
    test.todo('submitForApproval service: validate params and pass requestedBy to fabric integration service');
    test.todo('approveSubmission service: validate params/body and pass requestedBy to fabric integration service');
    test.todo('rejectSubmission service: validate params/body and pass requestedBy to fabric integration service');
});
