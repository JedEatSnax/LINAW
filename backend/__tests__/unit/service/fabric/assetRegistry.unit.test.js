jest.mock('../../../../config/fabric/fabricGateway.js', () => ({
    getContract: jest.fn()
}));

const { getContract } = require('../../../../config/fabric/fabricGateway.js');
const AppError = require('../../../../utils/AppError.js');
const assetRegistry = require('../../../../service/fabric/assetRegistry.js');
const { toBuffer } = require('../../../helpers/fabricResultHelpers.js');

describe('backend/service/fabric/assetRegistry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createAsset calls getContract + submitTransaction with correct arguments', async () => {
        const contract = {
            submitTransaction: jest.fn().mockResolvedValue(toBuffer({ id: 'asset-1' }))
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.createAsset({
            id: 'asset-1',
            color: 'blue',
            size: 10,
            owner: 'alice',
            appraisedValue: 99,
            requestedBy: 'uid-1'
        });

        expect(getContract).toHaveBeenCalledWith('assetRegistryContract');
        expect(contract.submitTransaction).toHaveBeenCalledWith(
            'CreateAsset',
            'asset-1',
            'blue',
            '10',
            'alice',
            '99'
        );
        expect(result).toEqual({
            message: 'Asset Created Succesfully',
            requested_by: 'uid-1',
            data: { id: 'asset-1' }
        });
    });

    it('createAsset propagates errors as AppError', async () => {
        const contract = {
            submitTransaction: jest.fn().mockRejectedValue(new Error('fabric failed'))
        };
        getContract.mockReturnValue(contract);

        await expect(
            assetRegistry.createAsset({
                id: 'asset-1',
                color: 'blue',
                size: 10,
                owner: 'alice',
                appraisedValue: 99,
                requestedBy: 'uid-1'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            message: 'fabric failed',
            statusCode: 500,
            code: 'FABRIC_CREATE_ASSSET_ERROR'
        });
    });

    it('assetRead calls evaluateTransaction with correct arguments', async () => {
        const contract = {
            evaluateTransaction: jest.fn().mockResolvedValue(toBuffer({ id: 'asset-1', owner: 'alice' }))
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetRead({ id: 'asset-1', requestedBy: 'uid-2' });

        expect(getContract).toHaveBeenCalledWith('assetRegistryContract');
        expect(contract.evaluateTransaction).toHaveBeenCalledWith('ReadAsset', 'asset-1');
        expect(result).toEqual({
            message: 'Asset fetched successfully',
            requested_by: 'uid-2',
            data: { id: 'asset-1', owner: 'alice' }
        });
    });

    it('assetReadAll calls evaluateTransaction with GetAllAssets', async () => {
        const contract = {
            evaluateTransaction: jest.fn().mockResolvedValue(toBuffer([{ id: 'asset-1' }]))
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetReadAll({ requestedBy: 'uid-3' });

        expect(contract.evaluateTransaction).toHaveBeenCalledWith('GetAllAssets');
        expect(result.data).toEqual([{ id: 'asset-1' }]);
    });

    it('assetTransfer calls submitAsync and returns parsed result after successful commit', async () => {
        const commit = {
            getResult: jest.fn(() => toBuffer({ id: 'asset-2', owner: 'bob' })),
            getStatus: jest.fn().mockResolvedValue({ successful: true, transactionId: 'tx-1', code: 0 })
        };
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(commit)
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetTransfer({
            id: 'asset-2',
            owner: 'bob',
            requestedBy: 'uid-10'
        });

        expect(contract.submitAsync).toHaveBeenCalledWith('TransferAsset', {
            arguments: ['asset-2', 'bob']
        });
        expect(result).toEqual({
            message: 'Asset Transferred Successfully',
            requested_by: 'uid-10',
            data: { id: 'asset-2', owner: 'bob' }
        });
    });

    it('assetTransfer wraps unsuccessful commit status in AppError', async () => {
        const commit = {
            getResult: jest.fn(() => toBuffer(null)),
            getStatus: jest.fn().mockResolvedValue({ successful: false, transactionId: 'tx-2', code: 500 })
        };
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(commit)
        };
        getContract.mockReturnValue(contract);

        await expect(
            assetRegistry.assetTransfer({
                id: 'asset-2',
                owner: 'bob',
                requestedBy: 'uid-10'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            statusCode: 500,
            code: 'FABRIC_TRANSFER_ASSET_ERROR'
        });
    });

    it('assetUpdate calls submitTransaction with mapped args', async () => {
        const contract = {
            submitTransaction: jest.fn().mockResolvedValue(toBuffer({ id: 'asset-3', color: 'red' }))
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetUpdate({
            id: 'asset-3',
            color: 'red',
            size: 6,
            owner: 'alice',
            appraisedValue: 100,
            requestedBy: 'uid-11'
        });

        expect(contract.submitTransaction).toHaveBeenCalledWith(
            'UpdateAsset',
            'asset-3',
            'red',
            '6',
            'alice',
            '100'
        );
        expect(result.data).toEqual({ id: 'asset-3', color: 'red' });
    });

    it('assetDelete calls submitAsync with id and returns parsed result', async () => {
        const commit = {
            getResult: jest.fn(() => toBuffer({ id: 'asset-4', deleted: true })),
            getStatus: jest.fn().mockResolvedValue({ successful: true, transactionId: 'tx-3', code: 0 })
        };
        const contract = {
            submitAsync: jest.fn().mockResolvedValue(commit)
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetDelete({
            id: 'asset-4',
            requestedBy: 'uid-12'
        });

        expect(contract.submitAsync).toHaveBeenCalledWith('DeleteAsset', {
            arguments: ['asset-4']
        });
        expect(result.data).toEqual({ id: 'asset-4', deleted: true });
    });

    it('assetRead wraps evaluateTransaction failures as AppError', async () => {
        const contract = {
            evaluateTransaction: jest.fn().mockRejectedValue(new Error('fabric read failed'))
        };
        getContract.mockReturnValue(contract);

        await expect(
            assetRegistry.assetRead({
                id: 'asset-5',
                requestedBy: 'uid-13'
            })
        ).rejects.toMatchObject({
            name: AppError.name,
            message: 'fabric read failed',
            statusCode: 500,
            code: 'FAILED_READ_ASSET_ERROR'
        });
    });
});
