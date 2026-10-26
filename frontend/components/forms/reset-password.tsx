"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validators/auth";

interface ApiResponse {
  success: boolean;
  message?: string;
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [resetToken, setResetToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    setResetToken(token ?? "");
    setTokenChecked(true);
  }, []);

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!resetToken) {
      setError(
        "Your password reset link is missing or invalid. Request a new link.",
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          resetToken,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || data.success !== true) {
        setError(
          data.message ??
            "Unable to reset your password. Your link may have expired.",
        );
        return;
      }

      setSuccess("Your password has been reset successfully.");
      form.reset();

      // Remove the password-reset token from the browser address bar.
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      setError("Unable to contact the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Reset Your Password</h1>
            <FieldDescription>
              Choose a new password containing 12–128 characters.
            </FieldDescription>
          </div>

          {tokenChecked && !resetToken && (
            <p role="alert" className="text-sm text-destructive">
              Your reset link is missing its token. Please request a new link.
            </p>
          )}

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  aria-invalid={fieldState.invalid}
                  className="bg-background"
                  disabled={!resetToken || isLoading || Boolean(success)}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm New Password
                </FieldLabel>
                <Input
                  {...field}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-invalid={fieldState.invalid}
                  className="bg-background"
                  disabled={!resetToken || isLoading || Boolean(success)}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </Field>
            )}
          />

          {error && (
            <output className="text-sm text-destructive">{error}</output>
          )}

          {success && (
            <output className="text-sm text-green-600">{success}</output>
          )}

          {success ? (
            <Button type="button" onClick={() => router.push("/login")}>
              Continue to Login
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!tokenChecked || !resetToken || isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          )}

          <FieldDescription className="text-center">
            <a href="/forgot-password" className="underline underline-offset-4">
              Request a new reset link
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
