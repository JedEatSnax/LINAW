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

    return Buffer.from(JSON.stringify(value));
}

module.exports = {
    toBuffer
};
