const { signupSchema, loginSchema } = require('../../../validators/user/userSchema');

describe('backend/validators/user', () => {
    it('signup schema accepts valid email', () => {
        const { error, value } = signupSchema.validate({ body: { email: 'alice@example.com' } });

        expect(error).toBeUndefined();
        expect(value).toEqual({ body: { email: 'alice@example.com' } });
    });

    it('signup schema rejects missing email', () => {
        const { error } = signupSchema.validate({ body: {} });

        expect(error).toBeDefined();
    });

    it('login schema accepts valid email', () => {
        const { error, value } = loginSchema.validate({ body: { email: 'alice@example.com' } });

        expect(error).toBeUndefined();
        expect(value).toEqual({ body: { email: 'alice@example.com' } });
    });

    it('login schema rejects missing email', () => {
        const { error } = loginSchema.validate({ body: {} });

        expect(error).toBeDefined();
    });
});
