function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };


/*
  NOTICE: were in express 5, which has built-in async error handling. This file is currently unused,
  but we can keep it around in case we need to support older versions of express or 
  if we want to have a consistent way of handling async errors across the codebase.
*/