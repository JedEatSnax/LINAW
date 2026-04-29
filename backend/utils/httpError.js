class HttpError extends Error {
  constructor(statusCode, message, details = {}) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function createHttpError(statusCode, message, details = {}) {
  return new HttpError(statusCode, message, details);
}

module.exports = {
  HttpError,
  createHttpError,
};