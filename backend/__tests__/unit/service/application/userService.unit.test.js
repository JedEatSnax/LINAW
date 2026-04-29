vi.mock('../../../../validators/user');
vi.mock('../../../../dao/userDao');

const validators = require('../../../../validators/user');
const userDao = require('../../../../dao/userDao');
const userService = require('../../../../service/application/userService');

describe('backend/service/application/userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set up default mocks
        validators.signupSchema = {
            validate: vi.fn().mockReturnValue({ error: null, value: {} })
        };
        validators.loginSchema = {
            validate: vi.fn().mockReturnValue({ error: null, value: {} })
        };
        userDao.signup = vi.fn();
        userDao.login = vi.fn();
    });

    it('validate throws for unknown schema key', () => {
        expect(() => userService.validate('unknownSchema', {})).toThrow(
            'Validation schema not found for key: unknownSchema'
        );
    });

    it('signup validates payload and delegates to userDao.signup', async () => {
        validators.signupSchema.validate.mockReturnValue({
            error: null,
            value: { body: { email: 'alice@example.com' } }
        });
        userDao.signup.mockResolvedValue({ user_id: 'u1', email: 'alice@example.com' });

        const result = await userService.signup({ body: { email: 'alice@example.com' } }, { uid: 'uid-1' });

        expect(userDao.signup).toHaveBeenCalledWith({ email: 'alice@example.com', firebase_uid: 'uid-1' });
        expect(result).toEqual({ user_id: 'u1', email: 'alice@example.com' });
    });

    it('login validates payload and delegates to userDao.login', async () => {
        validators.loginSchema.validate.mockReturnValue({
            error: null,
            value: { body: { email: 'alice@example.com' } }
        });
        userDao.login.mockResolvedValue({ user_id: 'u1', email: 'alice@example.com' });

        const result = await userService.login({ body: { email: 'alice@example.com' } }, { uid: 'uid-1' });

        expect(userDao.login).toHaveBeenCalledWith({ email: 'alice@example.com', firebase_uid: 'uid-1' });
        expect(result).toEqual({ user_id: 'u1', email: 'alice@example.com' });
    });

    it('throws ValidationError when signup validation fails', async () => {
        validators.signupSchema.validate.mockReturnValue({
            error: {
                details: [{ message: '"email" is required' }]
            }
        });

        await expect(userService.signup({ body: {} })).rejects.toThrow('Validation failed');
        expect(userDao.signup).not.toHaveBeenCalled();
    });

    it('throws ValidationError when login validation fails', async () => {
        validators.loginSchema.validate.mockReturnValue({
            error: {
                details: [{ message: '"email" is required' }]
            }
        });

        await expect(userService.login({ body: {} })).rejects.toThrow('Validation failed');
        expect(userDao.login).not.toHaveBeenCalled();
    });
});
