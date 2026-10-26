import { z } from "zod";

// ==========
// Find by Id
// ==========

export const findByIdSchema = z.object({
  id: z.string().uuid("Invalid user Id"),
});

// ==========
// Forgot password validation schema
// ==========

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .max(255, "Email is too long")
    .trim()
    .toLowerCase(),
});

// ==========
// Reset password validation schema
// ==========

export const resetPasswordSchema = z
  .object({
    resetToken: z
      .string()
      .min(10, "Reset token is required")
      .max(512, "Reset token is too long"),

    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password is too long"),

    confirmPassword: z.string(),
  })
  .refine(
    (data: { resetToken: string; password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      message: "Password do not match",
      path: ["confirmPassword"],
    },
  );

// ==========
// Signup validation schema
// ==========

export const signupSchema = z
  .object({
    first_name: z
      .string()
      .min(3, "Must have a minimum of 3 characters")
      .max(40, "First name too long"),

    last_name: z
      .string()
      .min(3, "Last must be 3 characters minimum ")
      .max(40, " Last name is too long"),

    email: z.string().email("Invalid email").trim().toLowerCase(),

    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password is too long"),

    confirmPassword: z.string(),

    invitation_token: z
      .string()
      .regex(/^[A-Fa-f0-9]{64}$/)
      .optional(),
  })
  .refine(
    (data: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => data.password === data.confirmPassword,
    {
      message: "Password do not match",
      path: ["confirmPassword"],
    },
  );

// ==========
// Login Validation schema
// ==========

export const loginSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),

  password: z
    .string()
    .min(12, " Must be 12 characters long")
    .max(128, "password is too long"),
});

// ==========
// Logout Validation Schema
// ==========

export const logoutSchema = z.object({
  session_Id: z.string().uuid("Invalid session Id"),
});

// ==========
// Interface
// ==========

export type signupInput = z.infer<typeof signupSchema>;

export type loginInput = z.infer<typeof loginSchema>;

export type logoutUser = z.infer<typeof logoutSchema>;

export type findById = z.infer<typeof findByIdSchema>;

export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;
