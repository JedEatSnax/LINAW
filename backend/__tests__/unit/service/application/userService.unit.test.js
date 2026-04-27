jest.mock('../../../../validators/user', () => ({
    signupSchema: { validate: jest.fn() },
    loginSchema: { validate: jest.fn() }
}));

jest.mock('../../../../dao/userDao', () => ({
    signup: jest.fn(),
    login: jest.fn()
}));

const validators = require('../../../../validators/user');
const userDao = require('../../../../dao/userDao');
const userService = require('../../../../service/application/userService');

describe('backend/service/application/userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        validators.signupSchema.validate.mockImplementation((data) => ({ error: null, value: data }));
        validators.loginSchema.validate.mockImplementation((data) => ({ error: null, value: data }));
    });

    it('validate throws for unknown schema key', () => {
        expect(() => userService.validate('unknown', {})).toThrow(
            'Validation schema not found for method: unknown'
        );
    });

    it('signup validates payload and delegates to userDao.signup', () => {
        validators.signupSchema.validate.mockReturnValue({
            error: null,
            value: { email: 'alice@example.com' }
        });
        userDao.signup.mockReturnValue({ email: 'alice@example.com' });

        const result = userService.signup({
            email: 'alice@example.com',
            ignored: 'x'
        });

        expect(userDao.signup).toHaveBeenCalledWith({ email: 'alice@example.com' });
        expect(result).toEqual({ email: 'alice@example.com' });
    });

    it('login validates payload and delegates to userDao.login', () => {
        validators.loginSchema.validate.mockReturnValue({
            error: null,
            value: { email: 'alice@example.com', firebase_uid: 'uid-1' }
        });
        userDao.login.mockReturnValue({ email: 'alice@example.com' });

        const result = userService.login({
            email: 'alice@example.com',
            firebase_uid: 'uid-1',
            extra: 'ignored'
        });

        expect(userDao.login).toHaveBeenCalledWith({
            email: 'alice@example.com',
            firebase_uid: 'uid-1'
        });
        expect(result).toEqual({ email: 'alice@example.com' });
    });

    it('throws ValidationError when signup validation fails', () => {
        validators.signupSchema.validate.mockReturnValue({
            error: {
                details: [{ message: '"email" is required' }]
            }
        });

        expect(() => userService.signup({})).toThrow('Validation failed');
        expect(userDao.signup).not.toHaveBeenCalled();
    });

    it('throws ValidationError when login validation fails', () => {
        validators.loginSchema.validate.mockReturnValue({
            error: {
                details: [{ message: '"firebase_uid" is required' }]
            }
        });

        expect(() => userService.login({ email: 'alice@example.com' })).toThrow('Validation failed');
        expect(userDao.login).not.toHaveBeenCalled();
    });
});
