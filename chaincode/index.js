'use-strict'

const assetRegistryContract = require('./lib/assetRegistryContract')
const approvalWorkflowContract = require('./lib/approvalWorkflowContract')
const accountingContract = require('./lib/accountingContract')

module.exports.contracts = [
    assetRegistryContract, 
    approvalWorkflowContract,
    accountingContract
]