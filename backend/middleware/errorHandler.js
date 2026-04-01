const AppError = require('../utils/AppError');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object;
}

function normalizeError(err) {
  if (err instanceof AppError) {
    return err;
  }

  if (err && err.isJoi && Array.isArray(err.details)) {
    return new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      err.details.map(d => d.message)
    );
  }

  if (err && err.name === 'ValidationError') {
    return new AppError(
      err.message || 'Validation failed',
      err.statusCode || 400,
      'VALIDATION_ERROR',
      Array.isArray(err.details) || isPlainObject(err.details) ? err.details : undefined
    );
  }

  if (err && typeof err.message === 'string') {
    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      return new AppError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    if (err.message === 'FORBIDDEN') {
      return new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    if (err.message === 'UNAUTHORIZED') {
      return new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
  }

  const statusCode =
    err && typeof err.statusCode === 'number' ? err.statusCode : 500;

  const code =
    err && typeof err.code === 'string'
      ? err.code
      : statusCode >= 500
        ? 'INTERNAL_ERROR'
        : 'ERROR';

  const details =
    err && (Array.isArray(err.details) || isPlainObject(err.details))
      ? err.details
      : undefined;

  return new AppError(
    statusCode >= 500 ? 'Internal server error' : (err?.message || 'Request failed'),
    statusCode,
    code,
    details
  );
}

function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  console.error({
    name: normalized.name,
    message: normalized.message,
    code: normalized.code,
    statusCode: normalized.statusCode,
    details: normalized.details,
    stack: normalized.stack,
    path: req.originalUrl,
    method: req.method,
  });

  if (res.headersSent) {
    return next(normalized);
  }

  return res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details !== undefined ? { details: normalized.details } : {}),
    },
  });
}

module.exports = errorHandler;