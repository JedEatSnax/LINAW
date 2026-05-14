vi.mock('../../../service/application/userService', () => ({
    signup: vi.fn(),
    login: vi.fn(),
    syncAuthenticatedUser: vi.fn()
}));

const userService = require('../../../service/application/userService');
const userController = require('../../../controllers/userController');

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('backend/controllers/userController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        userService.signup = vi.fn();
        userService.login = vi.fn();
        userService.syncAuthenticatedUser = vi.fn();
    });

    it('signup returns 201 with success payload', async () => {
        const mockUser = { email: 'alice@example.com', tenant_id: 'tenant-generated', message: 'Signup request accepted' };
        userService.signup.mockResolvedValue(mockUser);

        const req = { body: { email: 'alice@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.signup(req, res, next);

        expect(userService.signup).toHaveBeenCalledWith({ email: 'alice@example.com' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Signup successful',
            data: mockUser
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('signup returns 400 when service returns empty result', async () => {
        userService.signup.mockResolvedValue(null);

        const req = { body: { email: 'alice@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.signup(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Signup failed'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('signup forwards thrown service error to next', async () => {
        const err = new Error('signup failed');
        userService.signup.mockRejectedValue(err);

        const req = { body: { email: 'alice@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.signup(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('syncUser returns 201 when the service creates a user', async () => {
        const mockUser = { user_id: 'u2', email: 'sync@example.com' };
        userService.syncAuthenticatedUser.mockResolvedValue({ created: true, user: mockUser });

        const req = { user: { uid: 'uid-2', email: 'sync@example.com', tenantId: 'tenant-2' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.syncUser(req, res, next);

        expect(userService.syncAuthenticatedUser).toHaveBeenCalledWith({
            firebase_uid: 'uid-2',
            email: 'sync@example.com',
            tenant_id: 'tenant-2'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User synced successfully',
            data: mockUser
        });
    });

    it('syncUser returns 409 when the service reports duplicate email', async () => {
        userService.syncAuthenticatedUser.mockRejectedValue(new Error('EMAIL_ALREADY_EXISTS'));

        const req = { user: { uid: 'uid-3', email: 'sync@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.syncUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
        expect(next).not.toHaveBeenCalled();
    });

    it('login returns 200 with success payload', async () => {
        const mockUser = { user_id: 'u1', email: 'alice@example.com' };
        userService.login.mockResolvedValue(mockUser);

        const req = { body: { email: 'alice@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.login(req, res, next);

        expect(userService.login).toHaveBeenCalledWith('alice@example.com');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login Successful',
            data: mockUser
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('login returns 400 when service returns empty result', async () => {
        userService.login.mockResolvedValue(undefined);

        const req = { body: { email: 'alice@example.com', firebase_uid: 'u1' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.login(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'login failed'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('login forwards thrown service error to next', async () => {
        const err = new Error('login failed');
        userService.login.mockRejectedValue(err);

        const req = { body: { email: 'alice@example.com', firebase_uid: 'u1' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.login(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });
});
