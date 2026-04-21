const AppError = require ("../../utils/AppError.js")
const { getContract } = require ("../../config/fabric/fabricGateway.js")
const { TextDecoder } = require ("node:util")

function parseBuffer (resultBuffer) {
    if (!resultBuffer || resultBuffer.length === 0 ) {
        return null
    } 

    const resultString = resultBuffer.toString()

    try {
        return JSON.parse(resultString)
    } catch (error) {
        return resultString
    }
}

class approvalWorkflow {
    
}