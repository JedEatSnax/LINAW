jest.mock('../../../../service/fabric/assetRegistry.js', () => ({
    networkCreate: jest.fn(),
    channelCreate: jest.fn(),
    smartContract: jest.fn(),
    contractReadAll: jest.fn(),
    createAsset: jest.fn(),
    assetTransfer: jest.fn(),
    assetUpdate: jest.fn(),
    assetDelete: jest.fn(),
    assetRead: jest.fn(),
    assetReadAll: jest.fn()
}));

const networkAssetsService = require('../../../../service/application/networkAssetsService.js');
const assetService = require('../../../../service/fabric/assetRegistry.js');
const AppError = require('../../../../utils/AppError.js');

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

    it('networkCreate validates payload and passes requestedBy through', async () => {
        assetService.networkCreate.mockResolvedValue({ id: 'n-1' });

        const result = await networkAssetsService.networkCreate({
            body: {
                name: 'net-a',
                description: 'desc',
                orgs: [
                    {
                        name: 'Org1',
                        msp_ID: 'Org1MSP'
                    }
                ]
            },
            user: { uid: 'firebase-uid-2' }
        });

        expect(assetService.networkCreate).toHaveBeenCalledWith({
            name: 'net-a',
            description: 'desc',
            orgs: [
                {
                    name: 'Org1',
                    msp_ID: 'Org1MSP'
                }
            ],
            requestedBy: 'firebase-uid-2'
        });
        expect(result).toEqual({ id: 'n-1' });
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

    it('networkRead currently throws not implemented AppError', async () => {
        await expect(
            networkAssetsService.networkRead({ params: {}, user: { uid: 'u1' } })
        ).rejects.toMatchObject({
            name: AppError.name,
            statusCode: 501,
            code: 'NOT_IMPLEMENTED'
        });
    });

    it('channelCreate validates and passes mapped values to fabric service', async () => {
        assetService.channelCreate.mockResolvedValue({ ok: true });

        const result = await networkAssetsService.channelCreate({
            params: { id: 'network-1' },
            body: {
                name: 'main-channel',
                memberOrgs: ['Org1MSP', 'Org2MSP']
            },
            user: { uid: 'u2' }
        });

        expect(assetService.channelCreate).toHaveBeenCalledWith({
            id: 'network-1',
            name: 'main-channel',
            memberOrgs: ['Org1MSP', 'Org2MSP'],
            requestedBy: 'u2'
        });
        expect(result).toEqual({ ok: true });
    });

    it('smartContract validates and passes mapped values to fabric service', async () => {
        assetService.smartContract.mockResolvedValue({ deployed: true });

        const result = await networkAssetsService.smartContract({
            params: { channel_id: 'channel-1' },
            body: {
                contractType: 'approval',
                contractName: 'approval-contract',
                version: '1'
            },
            user: { uid: 'u3' }
        });

        expect(assetService.smartContract).toHaveBeenCalledWith({
            channel_id: 'channel-1',
            contractType: 'approval',
            contractName: 'approval-contract',
            version: '1',
            requestedBy: 'u3'
        });
        expect(result).toEqual({ deployed: true });
    });

    it('contractReadAll validates and passes channel id and requestedBy', async () => {
        assetService.contractReadAll.mockResolvedValue([{ name: 'c1' }]);

        const result = await networkAssetsService.contractReadAll({
            params: { channel_id: 'channel-2' },
            user: { uid: 'u4' }
        });

        expect(assetService.contractReadAll).toHaveBeenCalledWith({
            channel_id: 'channel-2',
            requestedBy: 'u4'
        });
        expect(result).toEqual([{ name: 'c1' }]);
    });

    it('assetTransfer validates and passes mapped values', async () => {
        assetService.assetTransfer.mockResolvedValue({ transferred: true });

        const result = await networkAssetsService.assetTransfer({
            params: { id: 'asset-1' },
            body: { owner: 'bob' },
            user: { uid: 'u5' }
        });

        expect(assetService.assetTransfer).toHaveBeenCalledWith({
            id: 'asset-1',
            owner: 'bob',
            requestedBy: 'u5'
        });
        expect(result).toEqual({ transferred: true });
    });

    it('assetUpdate validates and passes mapped values', async () => {
        assetService.assetUpdate.mockResolvedValue({ updated: true });

        const result = await networkAssetsService.assetUpdate({
            params: { id: 'asset-2' },
            body: {
                color: 'black',
                size: 5,
                owner: 'eve',
                appraisedValue: 750
            },
            user: { uid: 'u6' }
        });

        expect(assetService.assetUpdate).toHaveBeenCalledWith({
            id: 'asset-2',
            color: 'black',
            size: 5,
            owner: 'eve',
            appraisedValue: 750,
            requestedBy: 'u6'
        });
        expect(result).toEqual({ updated: true });
    });

    it('assetDelete validates and passes mapped values', async () => {
        assetService.assetDelete.mockResolvedValue({ deleted: true });

        const result = await networkAssetsService.assetDelete({
            params: { id: 'asset-3' },
            user: { uid: 'u7' }
        });

        expect(assetService.assetDelete).toHaveBeenCalledWith({
            id: 'asset-3',
            requestedBy: 'u7'
        });
        expect(result).toEqual({ deleted: true });
    });

    it('assetRead validates and passes mapped values', async () => {
        assetService.assetRead.mockResolvedValue({ id: 'asset-4' });

        const result = await networkAssetsService.assetRead({
            params: { id: 'asset-4' },
            user: { uid: 'u8' }
        });

        expect(assetService.assetRead).toHaveBeenCalledWith({
            id: 'asset-4',
            requestedBy: 'u8'
        });
        expect(result).toEqual({ id: 'asset-4' });
    });

    it('assetReadAll passes requestedBy without additional validation', async () => {
        assetService.assetReadAll.mockResolvedValue([{ id: 'asset-1' }, { id: 'asset-2' }]);

        const result = await networkAssetsService.assetReadAll({
            user: { uid: 'u9' }
        });

        expect(assetService.assetReadAll).toHaveBeenCalledWith({
            requestedBy: 'u9'
        });
        expect(result).toEqual([{ id: 'asset-1' }, { id: 'asset-2' }]);
    });

    it('validate throws when schema key does not exist', () => {
        expect(() => networkAssetsService.validate('missingSchema', {})).toThrow(
            'Validation schema not found for key: missingSchema'
        );
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
