vi.mock('../../../service/application/userService');

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
    });

    it('signup returns 201 with success payload', async () => {
        userService.signup.mockResolvedValue({ email: 'alice@example.com' });

        const req = { body: { email: 'alice@example.com' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.signup(req, res, next);

        expect(userService.signup).toHaveBeenCalledWith({ email: 'alice@example.com' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            email: 'alice@example.com',
            message: 'Signup successful'
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

    it('login returns 200 with success payload', async () => {
        userService.login.mockResolvedValue({ email: 'alice@example.com' });

        const req = { body: { email: 'alice@example.com', firebase_uid: 'u1' } };
        const res = makeRes();
        const next = vi.fn();

        await userController.login(req, res, next);

        expect(userService.login).toHaveBeenCalledWith({
            email: 'alice@example.com',
            firebase_uid: 'u1'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            email: 'alice@example.com',
            message: 'Login Successful'
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
