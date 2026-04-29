const authorization = require('../../../middleware/authorize');
const policies = require('../../../config/authorization/rules');

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('backend/middleware/authorize', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        policies.create_network = vi.fn(() => true);
        policies.manage_network = vi.fn(() => true);
    });

    it('returns 401 when req.user is missing', () => {
        const middleware = authorization.can('create_network');
        const req = {};
        const res = makeRes();
        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'UNAUTHORIZED' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user lacks required permission', () => {
        const middleware = authorization.can('manage_network');
        const req = {
            user: {
                role: 'user'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'FORBIDDEN' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when policy check fails', () => {
        policies.create_network.mockReturnValue(false);

        const middleware = authorization.can('create_network');
        const req = {
            user: {
                role: 'user'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        middleware(req, res, next);

        expect(policies.create_network).toHaveBeenCalledWith(req.user, req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Policy check failed' });
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when permission and policy checks pass', () => {
        const middleware = authorization.can('create_network');
        const req = {
            user: {
                role: 'user',
                uid: 'u1'
            }
        };
        const res = makeRes();
        const next = vi.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
