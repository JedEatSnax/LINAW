import type { MiddlewareHandler } from "hono";
import type { ZodType } from "zod";
import { InvalidDataError } from "./appError.js";

export const validate = <T extends ZodType>(schema: T): MiddlewareHandler => {
  return async (c, next) => {
    const body = await c.req.json();

    const result = await schema.safeParseAsync(body);

    if (!result.success) {
      const errorDetails = result.error.flatten(
        (issue) => issue.message,
      ).fieldErrors;

      throw new InvalidDataError("Validation failed", errorDetails);
    }

    c.set("validatedBody", result.data);

    await next();
  };
};
