export function errorHandler(error, _request, response, _next) {
  const statusCode = Number(error?.statusCode) || 500;

  response.status(statusCode).json({
    ok: false,
    error: error?.message ?? "Unexpected server error",
    ...(error?.details && typeof error.details === "object"
      ? error.details
      : {}),
  });
}
