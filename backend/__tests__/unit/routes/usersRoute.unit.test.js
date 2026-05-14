vi.mock('../../../controllers/userController', () => ({
    signup: vi.fn(),
    login: vi.fn()
}));

vi.mock('../../../middleware/rateLimiter', () => ({
    strictLimiter: vi.fn((req, res, next) => next())
}));

const userController = require('../../../controllers/userController');
const { strictLimiter } = require('../../../middleware/rateLimiter');
const { router } = require('../../../routes/usersRoute');

function findRoute(path, method) {
    return router.stack.find((layer) => {
        return layer.route && layer.route.path === path && layer.route.methods[method];
    });
}

describe('backend/routes/usersRoute', () => {
    it('registers POST /signup with limiter and signup controller', () => {
        const routeLayer = findRoute('/signup', 'post');

        expect(routeLayer).toBeDefined();
        expect(routeLayer.route.stack).toHaveLength(2);
        expect(routeLayer.route.stack[0].handle).toBe(strictLimiter);
        expect(routeLayer.route.stack[1].handle).toBe(userController.signup);
    });

    it('registers POST /login with limiter and login controller', () => {
        const routeLayer = findRoute('/login', 'post');

        expect(routeLayer).toBeDefined();
        expect(routeLayer.route.stack).toHaveLength(2);
        expect(routeLayer.route.stack[0].handle).toBe(strictLimiter);
        expect(routeLayer.route.stack[1].handle).toBe(userController.login);
    });
});
