const stringify = require('json-stringify-deterministic');
const { vi } = require('vitest');

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
        getState: vi.fn(async (key) => toBuffer(worldState.get(key))),
        putState: vi.fn(async (key, valueBuffer) => {
            worldState.set(key, JSON.parse(valueBuffer.toString()));
        }),
        deleteState: vi.fn(async (key) => {
            worldState.delete(key);
        }),
        getHistoryForKey: vi.fn(async (key) => {
            const records = historyByKey[key] || [];
            return createAsyncHistoryIterator(records);
        })
    };

    const clientIdentity = {
        getMSPID: vi.fn(() => mspId),
        assertAttributeValue: vi.fn((name, expectedValue) => {
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
