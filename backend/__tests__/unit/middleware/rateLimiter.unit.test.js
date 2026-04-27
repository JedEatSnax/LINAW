const { strictLimiter, apiLimiter } = require('../../../middleware/rateLimiter');

describe('backend/middleware/rateLimiter', () => {
    it('exports strictLimiter and apiLimiter middleware functions', () => {
        expect(typeof strictLimiter).toBe('function');
        expect(typeof apiLimiter).toBe('function');
    });
});
