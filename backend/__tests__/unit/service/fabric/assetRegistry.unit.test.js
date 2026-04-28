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

let getContract;
const AppError = require('../../../../utils/AppError.js');
const assetRegistry = require('../../../../service/fabric/assetRegistry.js');
const { toBuffer } = require('../../../helpers/fabricResultHelpers.js');

describe('backend/service/fabric/assetRegistry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getContractMock = vi.spyOn(fabricGateway, 'getContract');
        getContract = getContractMock;
    });

    it('createAsset calls getContract + submitTransaction with correct arguments', async () => {
        const contract = {
            submitTransaction: vi.fn().mockResolvedValue(toBuffer({ id: 'asset-1' }))
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
            submitTransaction: vi.fn().mockRejectedValue(new Error('fabric failed'))
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
            evaluateTransaction: vi.fn().mockResolvedValue(toBuffer({ id: 'asset-1', owner: 'alice' }))
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
            evaluateTransaction: vi.fn().mockResolvedValue(toBuffer([{ id: 'asset-1' }]))
        };
        getContract.mockReturnValue(contract);

        const result = await assetRegistry.assetReadAll({ requestedBy: 'uid-3' });

        expect(contract.evaluateTransaction).toHaveBeenCalledWith('GetAllAssets');
        expect(result.data).toEqual([{ id: 'asset-1' }]);
    });

    it('assetTransfer calls submitAsync and returns parsed result after successful commit', async () => {
        const commit = {
            getResult: vi.fn(() => toBuffer({ id: 'asset-2', owner: 'bob' })),
            getStatus: vi.fn().mockResolvedValue({ successful: true, transactionId: 'tx-1', code: 0 })
        };
        const contract = {
            submitAsync: vi.fn().mockResolvedValue(commit)
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
            getResult: vi.fn(() => toBuffer(null)),
            getStatus: vi.fn().mockResolvedValue({ successful: false, transactionId: 'tx-2', code: 500 })
        };
        const contract = {
            submitAsync: vi.fn().mockResolvedValue(commit)
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
            submitTransaction: vi.fn().mockResolvedValue(toBuffer({ id: 'asset-3', color: 'red' }))
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
            getResult: vi.fn(() => toBuffer({ id: 'asset-4', deleted: true })),
            getStatus: vi.fn().mockResolvedValue({ successful: true, transactionId: 'tx-3', code: 0 })
        };
        const contract = {
            submitAsync: vi.fn().mockResolvedValue(commit)
        };
        getContractMock.mockReturnValue(contract);

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
            evaluateTransaction: vi.fn().mockRejectedValue(new Error('fabric read failed'))
        };
        getContractMock.mockReturnValue(contract);

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
