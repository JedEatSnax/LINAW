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
});
