const request = require('supertest');
const express = require('express');

const errorHandler = require('../middleware/errorHandler');

jest.mock('../middleware/rateLimiter', () => ({
  strictLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
}));

jest.mock('../middleware/authenticate', () => ({
  decodeToken: jest.fn(),
}));

jest.mock('../middleware/authorize', () => ({
  can: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../service/application/userService', () => ({
  signup: jest.fn(),
  login: jest.fn(),
}));

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const userService = require('../service/application/userService');

function makeApp({ withAuthorize = false } = {}) {
  const { router } = require('../routes/usersRoute');

  const app = express();
  app.use(express.json());

  if (withAuthorize) {
    app.use('/api', authorize.can('ANY_PERMISSION'), router);
  } else {
    app.use('/api', router);
  }

  app.use(errorHandler);
  return app;
}

function validationError(details) {
  return {
    name: 'ValidationError',
    message: 'Validation failed',
    statusCode: 400,
    details,
  };
}

describe('usersRoute integration', () => {
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    authenticate.decodeToken.mockImplementation((req, res, next) => {
      req.user = { uid: 'u1', email: 'auth@example.com', role: 'user' };
      next();
    });

    authorize.can.mockImplementation(() => (req, res, next) => next());
  });

  test('POST /api/signup - success', async () => {
    userService.signup.mockResolvedValue({ email: 'alice@example.com' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/signup')
      .send({ email: 'alice@example.com', firebase_uid: 'fb1' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      email: 'alice@example.com',
      message: 'Signup successful',
    });
  });

  test('POST /api/signup - 400 validation error (errorHandler format)', async () => {
    userService.signup.mockImplementation(() => {
      throw validationError(['"email" is required']);
    });

    const app = makeApp();
    const res = await request(app).post('/api/signup').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: ['"email" is required'],
      },
    });
  });

  test('POST /api/login - 401 unauthenticated (errorHandler format)', async () => {
    authenticate.decodeToken.mockImplementation((req, res, next) => next(new Error('UNAUTHORIZED')));

    const app = makeApp();
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'alice@example.com', firebase_uid: 'fb1' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  test('POST /api/login - 403 forbidden via authorization middleware (errorHandler format)', async () => {
    authorize.can.mockImplementation(() => (req, res, next) => next(new Error('FORBIDDEN')));

    const app = makeApp({ withAuthorize: true });
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'alice@example.com', firebase_uid: 'fb1' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Forbidden',
      },
    });
  });

  test('POST /api/login - 500 internal error (errorHandler format)', async () => {
    userService.login.mockImplementation(() => {
      throw new Error('db down');
    });

    const app = makeApp();
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'alice@example.com', firebase_uid: 'fb1' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
