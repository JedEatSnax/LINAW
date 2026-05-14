const { auth } = require('../../../config/firebase-config');

if (!auth.verifyIdToken || typeof auth.verifyIdToken.mockResolvedValue !== 'function') {
    auth.verifyIdToken = vi.fn();
}
const authenticate = require('../../../middleware/authenticate');

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('backend/middleware/authenticate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when bearer token is missing', async () => {
        const req = {
            headers: {}
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401
        }));
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when bearer token is present but empty', async () => {
        const req = {
            headers: {
                authorization: 'Bearer '
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401,
            code: 'AUTH_INVALID_FORMAT'
        }));
    });

    it('returns 401 when decoded token is missing uid claim', async () => {
        auth.verifyIdToken.mockResolvedValue({ email: 'u1@example.com' });

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401,
            code: 'INVALID_TOKEN',
            message: 'Missing uid claim'
        }));
        expect(req.user).toBeUndefined();
    });

    it('returns 401 when decoded token is missing email claim', async () => {
        auth.verifyIdToken.mockResolvedValue({ uid: 'u1' });

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401,
            code: 'INVALID_TOKEN',
            message: 'Missing email claim'
        }));
        expect(req.user).toBeUndefined();
    });

    it('sets req.user and calls next when token is valid', async () => {
        auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'u1@example.com' });

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(auth.verifyIdToken).toHaveBeenCalledWith('token-123');
        expect(req.user).toEqual({
            uid: 'u1',
            email: 'u1@example.com',
            email_verified: false,
            role: 'user',
            tenantId: null,
            claims: { uid: 'u1', email: 'u1@example.com' }
        });
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('returns 401 when token verification throws', async () => {
        auth.verifyIdToken.mockRejectedValue(new Error('invalid token'));

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            name: 'AppError',
            statusCode: 401
        }));
        expect(res.status).not.toHaveBeenCalled();
    });
});
