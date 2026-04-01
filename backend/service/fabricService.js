const AppError = require('../utils/AppError')

const notImplemented = (operation) => {
	throw new AppError(`${operation} is not implemented`, 501, 'NOT_IMPLEMENTED');
};

module.exports = {
	async networkCreate() {
		return notImplemented('networkCreate');
	},
	async networkRead() {
		return notImplemented('networkRead');
	},
	async channelCreate() {
		return notImplemented('channelCreate');
	},
	async channelRead() {
		return notImplemented('channelRead');
	},
	async smartContract() {
		return notImplemented('smartContract');
	},
	async contractReadAll() {
		return notImplemented('contractReadAll');
	},
	async createAsset() {
		return notImplemented('createAsset');
	},
	async assetTransfer() {
		return notImplemented('assetTransfer');
	},
	async assetUpdate() {
		return notImplemented('assetUpdate');
	},
	async assetRead() {
		return notImplemented('assetRead');
	},
	async assestReadAll() {
		return notImplemented('assestReadAll');
	},
};