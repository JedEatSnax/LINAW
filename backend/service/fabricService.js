const AppError = require('../utils/AppError')
const { getContract } = require ('../config/fabric/fabricGateway.js')
const { TextDecoder } = require('node:util');

function parseBuffer (resultBuffer) {
	if (!resultBuffer  || resultBuffer.length === 0 ) {
		return null
	}

	const resultString = resultBuffer.toString()

	try {
		return JSON.parse(resultString)
	} catch (error) {
		return resultString
	}
}

class fabricService {
	
	async createAsset ({ id, color, size, owner, appraisedValue, requestedBy }) {
		try {
			const contract = getContract()

			const result = await contract.submitTransaction(
				'CreateAsset',
				id, 
				color,
				String(size), 
				owner,
				String(appraisedValue),
			)

			return { 
				message: 'Asset Created Succesfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}
		} catch (error) {
			throw new AppError ( error.message || 'Failed to create asset', 500, 'FABRIC_CREATE_ASSSET_ERROR'
			)
		}
	}
	
	async assetTransfer ({ id, owner, requestedBy }) {
		try {
			const contract = getContract()

 			const commit = await contract.submitAsync('TransferAsset', {
      			arguments: [id, owner],
    		});

			const result = commit.getResult()

			const status = await commit.getStatus()
			if(!status.successful){
				throw new Error(
					`Transaction ${status.transactionId} failed to commit with status code ${String(status.code)}`
				)
			}

			return {
				message: 'Asset Transferred Successfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}

		} catch (error) {
			throw new AppError ( error.message || 'Failed to transfer asset', 500, 'FABRIC_TRANSFER_ASSET_ERROR')
		}
	}
	
	async assetUpdate ({ id, color, size, owner, appraisedValue, requestedBy }) {
		try {
			const contract = getContract()

			const result = await contract.submitTransaction(
				'UpdateAsset',
				id,
				color,
				String(size),
				owner,
				String(appraisedValue)
			)

			return {
				message: 'Asset Updated Successfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}
		} catch (error) {
			throw new AppError ( error.message || 'Failed to update asset', 500, 'FABRIC_UPDATE_ASSET_ERROR')
		}
	}

	async assetDelete ({ id, requestedBy }) {
		try {
			const contract = getContract()

			const commit = await contract.submitAsync(
				'DeleteAsset',
				{arguements: [id]}
			)

			const result = commit.getResult()

			const status = await commmit.getStatus()
			if(!status.successful){
				throw new Error(
					`Transaction ${status.transactionId} failed to commit with status code ${String(status.code)}`
				)
			}

			return {
				message: 'Asset Deleted Successfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}

		} catch (error) {
			throw new AppError ( error.message || 'Failed to delete asset', 500, 'FABRIC_DELETE_ASSET_ERROR')
		}
	}

	async assetRead ({ id, requestedBy }) {
		try {
			const contract = getContract()

			const result = await contract.evaluateTransaction(
				'ReadAsset',
				id
			)

			return {
				message: 'Asset fetched successfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}
		} catch (error) {
			throw new AppError ( error.message || 'Failed to fetch asset', 500, 'FAILED_READ_ASSET_ERROR' )
		}
	}

	async assetReadAll ({ requestedBy }) {
		try {
			const contract = getContract()

			const result = await contract.evaluateTransaction('GetAllAssets')

			return {
				message: 'Assets fetched successfully',
				requested_by: requestedBy,
				data: parseBuffer(result)
			}
		} catch (error) {
			throw new AppError ( error.message || 'Failed to fetch all asset', 500, 'FABRIC_READ_ALL_ASSETS_ERROR'
			)
		}
	}

}


module.exports = new fabricService();