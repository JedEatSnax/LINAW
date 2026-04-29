const stringify = require('json-stringify-deterministic');

function toBuffer(value) {
    if (value === undefined || value === null) {
        return Buffer.alloc(0);
    }

    if (Buffer.isBuffer(value)) {
        return value;
    }

    if (typeof value === 'string') {
        return Buffer.from(value);
    }

    return Buffer.from(stringify(value));
}

function createAsyncHistoryIterator(records) {
    return {
        async *[Symbol.asyncIterator]() {
            for (const record of records) {
                yield record;
            }
        }
    };
}

function createMockContext(options = {}) {
    const {
        mspId = 'OrgMSP',
        attributes = {},
        state = {},
        historyByKey = {}
    } = options;

    const worldState = new Map(Object.entries(state));

    const stub = {
        getState: jest.fn(async (key) => toBuffer(worldState.get(key))),
        putState: jest.fn(async (key, valueBuffer) => {
            worldState.set(key, JSON.parse(valueBuffer.toString()));
        }),
        deleteState: jest.fn(async (key) => {
            worldState.delete(key);
        }),
        getHistoryForKey: jest.fn(async (key) => {
            const records = historyByKey[key] || [];
            return createAsyncHistoryIterator(records);
        })
    };

    const clientIdentity = {
        getMSPID: jest.fn(() => mspId),
        assertAttributeValue: jest.fn((name, expectedValue) => {
            return attributes[name] === expectedValue;
        })
    };

    return {
        ctx: { stub, clientIdentity },
        stub,
        clientIdentity,
        worldState
    };
}

function getJsonFromPutStateCall(putStateMock, callIndex = 0) {
    const bufferArg = putStateMock.mock.calls[callIndex][1];
    return JSON.parse(bufferArg.toString());
}

module.exports = {
    createMockContext,
    getJsonFromPutStateCall,
    toBuffer
};
