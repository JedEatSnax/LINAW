jest.mock('../../../config/firebase-config', () => ({
    auth: {
        verifyIdToken: jest.fn()
    }
}));

const { auth } = require('../../../config/firebase-config');
const authenticate = require('../../../middleware/authenticate');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('backend/middleware/authenticate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when bearer token is missing', async () => {
        const req = {
            headers: {}
        };
        const res = makeRes();
        const next = jest.fn();

        await authenticate.decodeToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Authorization header is required',
            code: 'AUTH_MISSING'
        });
        expect(next).not.toHaveBeenCalled();
        expect(auth.verifyIdToken).not.toHaveBeenCalled();
    });

    it('sets req.user and calls next when token is valid', async () => {
        auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'u1@example.com' });

        const req = {
            headers: {
                authorization: 'Bearer token-123'
            }
        };
        const res = makeRes();
        const next = jest.fn();

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
        const next = jest.fn();

        await authenticate.decodeToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Unauthorized',
            code: 'AUTH_FAILED'
        });
        expect(next).not.toHaveBeenCalled();
    });
});
