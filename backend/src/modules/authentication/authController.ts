import type { Context } from "hono";
import type { AppContext } from "../../shared/types/hono.js";
import { getCookie } from "hono/cookie";
import { AuthService } from "./authServices.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  findByIdSchema,
} from "./authValidator.js";
import {
  InvalidTokenError,
  UnauthorizedAccessError,
} from "../../shared/errors/appError.js";

export class AuthController {
  constructor(private service: AuthService) {}

  getUserById = async (c: Context<AppContext>) => {
    const input = findByIdSchema.parse({
      id: c.req.param("id"),
    });

    const authenticatedUser = c.get("user");

    if (!authenticatedUser) {
      throw new UnauthorizedAccessError("Authentication required");
    }

    const user = await this.service.findId(input, authenticatedUser.user_id);

    return c.json(
      {
        success: true,
        message: "User found",
        data: user,
      },
      200,
    );
  };

  createUser = async (c: Context<AppContext>) => {
    const body = await c.req.json();
    const data = signupSchema.parse(body);

    const result = await this.service.register(data);

    return c.json(
      {
        success: true,
        message: "Account created successfully",
        result,
      },
      201,
    );
  };

  loginUser = async (c: Context<AppContext>) => {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const result = await this.service.login(data);

    return c.json(
      {
        success: true,
        message: "Login successful",
        result,
      },
      200,
    );
  };

  forgotPassword = async (c: Context<AppContext>) => {
    const body = await c.req.json();
    const data = forgotPasswordSchema.parse(body);

    await this.service.requestPasswordReset(data);

    return c.json(
      {
        success: true,
        message:
          "If the account exists, password reset instructions have been sent.",
      },
      200,
    );
  };

  resetPassword = async (c: Context<AppContext>) => {
    const body = await c.req.json();
    const data = resetPasswordSchema.parse(body);

    await this.service.resetPassword(data);

    return c.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      200,
    );
  };

  logoutUser = async (c: Context<AppContext>) => {
    const refreshToken = getCookie(c, "refreshToken");

    if (!refreshToken) {
      throw new InvalidTokenError("Missing refresh token");
    }

    const result = await this.service.logout(refreshToken);

    // The Next.js server integration is responsible for clearing
    // browser-facing cookies. The backend does not set those cookies.

    return c.json(
      {
        success: true,
        message: "Logged out successfully",
        result,
      },
      200,
    );
  };

  refreshToken = async (c: Context<AppContext>) => {
    const refreshToken = getCookie(c, "refreshToken");

    if (!refreshToken) {
      throw new InvalidTokenError("Missing refresh token");
    }

    const result = await this.service.refresh(refreshToken);

    // Return the rotated tokens to the trusted server-side integration.
    // Do not delete cookies here: the backend never set them.

    return c.json(
      {
        success: true,
        message: "Session refreshed successfully",
        result,
      },
      200,
    );
  };

  validate_token = async (c: Context<AppContext>) => {
    // The route's authenticate middleware must validate the access JWT
    // before this handler can execute.
    const user = c.get("user");

    return c.json(
      {
        success: true,
        message: "Token is valid",
        data: {
          user_id: user.user_id,
          session_id: user.session_id,
          tenant_id: user.tenant_id,
          company_id: user.company_id,
        },
      },
      200,
    );
  };
}
