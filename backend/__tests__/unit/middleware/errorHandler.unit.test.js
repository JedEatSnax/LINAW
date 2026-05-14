const AppError = require('../../../utils/AppError');
const errorHandler = require('../../../middleware/errorHandler');

function makeReq() {
    return {
        originalUrl: '/api/test',
        method: 'POST'
    };
}

function makeRes(headersSent = false) {
    const res = {
        headersSent,
        status: vi.fn(),
        json: vi.fn()
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    return res;
}

describe('backend/middleware/errorHandler', () => {
    let consoleSpy;

    beforeAll(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    it('returns AppError payload as-is', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(new AppError('Forbidden', 403, 'FORBIDDEN'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'FORBIDDEN',
                message: 'Forbidden'
            }
        });
    });

    it('normalizes ValidationError shape with details', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(
            {
                name: 'ValidationError',
                message: 'Validation failed',
                statusCode: 400,
                details: ['"email" is required']
            },
            req,
            res,
            next
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: ['"email" is required']
            }
        });
    });

    it('normalizes UNAUTHORIZED errors by message', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(new Error('UNAUTHORIZED'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    });

    it('normalizes generic errors to 500 internal error', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(new Error('boom'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    });

    it('normalizes Multer file size errors', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(
            {
                name: 'MulterError',
                code: 'LIMIT_FILE_SIZE',
                message: 'File too large'
            },
            req,
            res,
            next
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'FILE_TOO_LARGE',
                message: 'File size exceeds 10MB limit'
            }
        });
    });

    it('normalizes Multer file count errors', () => {
        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        errorHandler(
            {
                name: 'MulterError',
                code: 'LIMIT_FILE_COUNT',
                message: 'Too many files'
            },
            req,
            res,
            next
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'TOO_MANY_FILES',
                message: 'Too many files uploaded'
            }
        });
    });

    it('calls next when headers already sent', () => {
        const req = makeReq();
        const res = makeRes(true);
        const next = vi.fn();

        errorHandler(new Error('boom'), req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const passedError = next.mock.calls[0][0];
        expect(passedError).toMatchObject({
            name: 'AppError',
            code: 'INTERNAL_ERROR',
            statusCode: 500
        });
    });
});
