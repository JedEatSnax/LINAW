jest.mock('../../../config/authorization/authorization', () => ({
    user: ['view_network'],
    network_admin: ['manage_network']
}));

jest.mock('../../../config/authorization/rules', () => ({
    view_network: jest.fn(() => true),
    manage_network: jest.fn(() => true)
}));

const policies = require('../../../config/authorization/rules');
const authorization = require('../../../middleware/authorize');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('backend/middleware/authorize', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        policies.view_network.mockReturnValue(true);
        policies.manage_network.mockReturnValue(true);
    });

    it('returns 401 when req.user is missing', () => {
        const middleware = authorization.can('view_network');
        const req = {};
        const res = makeRes();
        const next = jest.fn();

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
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'FORBIDDEN' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when policy check fails', () => {
        policies.view_network.mockReturnValue(false);

        const middleware = authorization.can('view_network');
        const req = {
            user: {
                role: 'user'
            }
        };
        const res = makeRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(policies.view_network).toHaveBeenCalledWith(req.user, req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Policy check failed' });
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when permission and policy checks pass', () => {
        const middleware = authorization.can('view_network');
        const req = {
            user: {
                role: 'user',
                uid: 'u1'
            }
        };
        const res = makeRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
