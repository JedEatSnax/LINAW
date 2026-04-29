const authMock = vi.hoisted(() => ({
    verifyIdToken: vi.fn()
}));

vi.mock('../../../config/firebase-config', () => ({
    auth: authMock
}));

const firebaseConfig = require('../../../config/firebase-config');
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

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Authorization header is required',
            code: 'AUTH_MISSING'
        });
        expect(next).not.toHaveBeenCalled();
        expect(firebaseConfig.auth.verifyIdToken).not.toHaveBeenCalled();
    });

    it('sets req.user and calls next when token is valid', async () => {
        authMock.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'u1@example.com' });

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(authMock.verifyIdToken).toHaveBeenCalledWith('token-123');
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
        authMock.verifyIdToken.mockRejectedValue(new Error('invalid token'));

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        await authenticate.decodeToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unauthorized',
            code: 'auth/argument-error'
        });
        expect(next).not.toHaveBeenCalled();
    });
});
