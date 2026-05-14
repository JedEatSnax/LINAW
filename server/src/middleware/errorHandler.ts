import type { ErrorRequestHandler } from "express";

const MAX_ERROR_LENGTH = 220;

function toCompactErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Failed to process request";
  const firstLine =
    raw.split(/\r?\n/)[0]?.trim() || "Failed to process request";

  if (firstLine.length <= MAX_ERROR_LENGTH) {
    return firstLine;
  }

  return `${firstLine.slice(0, MAX_ERROR_LENGTH)}...`;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(400).json({
    error: toCompactErrorMessage(error),
  });
};
