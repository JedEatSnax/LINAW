"use strict";

const { Contract } = require('fabric-contract-api');

class AccountingContract extends Contract {
	constructor() {
		super('accountingContract');
	}

	// Minimal noop methods to keep chaincode coherent; implement as needed.
	async InitLedger(ctx) {
		// no-op initializer
		return 'initialized';
	}

	async Ping(ctx) {
		return 'pong';
	}
}

module.exports = AccountingContract;
