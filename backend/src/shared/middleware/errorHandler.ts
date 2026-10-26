import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import type { AppContext } from "../types/hono.js";
import { AppError, InvalidDataError } from "../errors/appError.js";

export function errorHandler(err: Error, c: Context<AppContext>) {
  console.error(err);

  if (err instanceof ZodError) {
    err = new InvalidDataError(
      "Validation failed",
      err.flatten((issue) => issue.message).fieldErrors,
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(c.env.NODE_ENV === "development" && {
            details: err.details,
          }),
        },
      },
      err.statusCode as ContentfulStatusCode,
    );
  }

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "something went wrong",
      },
    },
    500,
  );
}
