const fabricSchema = require('../../../validators/fabric/fabricSchema');

describe('backend/validators/fabric/fabricSchema', () => {
    it('createAssetSchema accepts valid payload', () => {
        const { error } = fabricSchema.createAssetSchema.validate({
            body: {
                id: 'asset-1',
                color: 'blue',
                size: 1,
                owner: 'alice',
                appraisedValue: 100
            }
        });

        expect(error).toBeUndefined();
    });

    it('createAssetSchema rejects missing required fields', () => {
        const { error } = fabricSchema.createAssetSchema.validate({
            body: {
                id: 'asset-1',
                color: 'blue'
            }
        });

        expect(error).toBeDefined();
    });

    it('assetTransferSchema rejects missing owner', () => {
        const { error } = fabricSchema.assetTransferSchema.validate({
            params: { id: 'asset-1' },
            body: {}
        });

        expect(error).toBeDefined();
    });

    it('networkCreateSchema accepts a valid network payload', () => {
        const { error } = fabricSchema.networkCreateSchema.validate({
            body: {
                name: 'network-1',
                description: 'desc',
                orgs: [
                    {
                        name: 'Org1',
                        msp_ID: 'Org1MSP'
                    }
                ]
            }
        });

        expect(error).toBeUndefined();
    });

    it('networkCreateSchema rejects duplicate msp_ID entries', () => {
        const { error } = fabricSchema.networkCreateSchema.validate({
            body: {
                name: 'network-1',
                orgs: [
                    { name: 'Org1', msp_ID: 'SameMSP' },
                    { name: 'Org2', msp_ID: 'SameMSP' }
                ]
            }
        });

        expect(error).toBeDefined();
    });
});
