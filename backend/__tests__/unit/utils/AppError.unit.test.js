const AppError = require('../../../utils/AppError');

describe('backend/utils/AppError', () => {
    it('sets defaults when optional constructor args are omitted', () => {
        const err = new AppError('Something went wrong');

        expect(err.name).toBe('AppError');
        expect(err.message).toBe('Something went wrong');
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe('INTERNAL_ERROR');
        expect(err.details).toBeUndefined();
        expect(err.isOperational).toBe(true);
    });

    it('keeps explicitly provided status code, code, and details', () => {
        const err = new AppError('Invalid input', 400, 'VALIDATION_ERROR', ['"email" is required']);

        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.details).toEqual(['"email" is required']);
    });
});
