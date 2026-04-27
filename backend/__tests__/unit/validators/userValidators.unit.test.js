const signupSchema = require('../../../validators/user/signupModel');
const loginSchema = require('../../../validators/user/loginModel');

describe('backend/validators/user', () => {
    it('signup schema accepts valid email', () => {
        const { error, value } = signupSchema.validate({ email: 'alice@example.com' });

        expect(error).toBeUndefined();
        expect(value).toEqual({ email: 'alice@example.com' });
    });

    it('signup schema rejects missing email', () => {
        const { error } = signupSchema.validate({});

        expect(error).toBeDefined();
    });

    it('login schema accepts valid email and firebase_uid', () => {
        const { error, value } = loginSchema.validate({
            email: 'alice@example.com',
            firebase_uid: 'uid-1'
        });

        expect(error).toBeUndefined();
        expect(value).toEqual({
            email: 'alice@example.com',
            firebase_uid: 'uid-1'
        });
    });

    it('login schema rejects missing firebase_uid', () => {
        const { error } = loginSchema.validate({
            email: 'alice@example.com'
        });

        expect(error).toBeDefined();
    });
});
