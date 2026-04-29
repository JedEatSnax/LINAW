const request = require('supertest');
const express = require('express');

const errorHandler = require('../middleware/errorHandler');

vi.mock('../middleware/rateLimiter', () => ({
  strictLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
}));

vi.mock('../middleware/authenticate', () => ({
  decodeToken: vi.fn(),
}));

vi.mock('../middleware/authorize', () => ({
  can: vi.fn(() => (req, res, next) => next()),
}));

vi.mock('../service/application/networkAssetsService', () => ({
  networkCreate: vi.fn(),
  networkRead: vi.fn(),
  channelCreate: vi.fn(),
  channelRead: vi.fn(),
  smartContract: vi.fn(),
  contractReadAll: vi.fn(),
  createAsset: vi.fn(),
  assetTransfer: vi.fn(),
  assetUpdate: vi.fn(),
  assetRead: vi.fn(),
  assestReadAll: vi.fn(),
}));

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const networkAssetsService = require('../service/application/networkAssetsService');

function makeApp({ withAuthorize = false } = {}) {
  const { router } = require('../routes/fabricRoute');

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

describe('fabricRoute integration', () => {
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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

  test('POST /api/networks - success', async () => {
    networkAssetsService.networkCreate.mockResolvedValue({ id: 'n1', name: 'net1' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/networks')
      .send({ name: 'net1', description: 'd', orgs: [{ name: 'Org1', msp_ID: 'Org1MSP' }] });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'n1', name: 'net1' });
  });

  test('POST /api/networks - 400 validation error (errorHandler format)', async () => {
    networkAssetsService.networkCreate.mockImplementation(() => {
      throw validationError(['"name" is required']);
    });

    const app = makeApp();
    const res = await request(app).post('/api/networks').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: ['"name" is required'],
      },
    });
  });

  test('GET /api/networks - 401 unauthenticated (errorHandler format)', async () => {
    authenticate.decodeToken.mockImplementation((req, res, next) => next(new Error('UNAUTHORIZED')));

    const app = makeApp();
    const res = await request(app).get('/api/networks');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  test('GET /api/networks - 403 forbidden via authorization middleware (errorHandler format)', async () => {
    authorize.can.mockImplementation(() => (req, res, next) => next(new Error('FORBIDDEN')));

    const app = makeApp({ withAuthorize: true });
    const res = await request(app).get('/api/networks');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Forbidden',
      },
    });
  });

  test('GET /api/networks - 500 internal error (errorHandler format)', async () => {
    networkAssetsService.networkRead.mockImplementation(() => {
      throw new Error('boom');
    });

    const app = makeApp();
    const res = await request(app).get('/api/networks');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
