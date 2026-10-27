"use client";

import { cn } from "cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpFormValues } from "@/validators/auth";
import { markAuthTransition, runAuthTransition } from "@/lib/auth-client";

function getSafeReturnTo() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/invitations/accept?token=") ? value : null;
}

function getInvitationToken() {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get(
    "invitationToken",
  );
  return token && /^[A-Fa-f0-9]{64}$/.test(token) ? token : null;
}

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const safeReturnTo = getSafeReturnTo();
  const invitationToken = getInvitationToken();
  const form = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema), defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" } });

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);
    try {
      const { response, data } = await runAuthTransition(async () => {
        const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: values.firstName, last_name: values.lastName, email: values.email, password: values.password, confirmPassword: values.confirmPassword, ...(invitationToken ? { invitation_token: invitationToken } : {}) }) });
        const data = (await response.json()) as { success?: boolean; message?: string };
        if (response.ok && data.success === true) markAuthTransition();
        return { response, data };
      });
      if (!response.ok || data.success !== true) {
        form.setError("root", { message: data.message ?? "Unable to create your account." });
        return;
      }
      router.push(safeReturnTo ?? "/dashboard");
    } catch {
      form.setError("root", { message: "Unable to reach the signup service. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome to LINAW</h1>
            <FieldDescription>Already have an account? <a href={safeReturnTo ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : "/login"}>Login</a></FieldDescription>
          </div>
          <Controller name="firstName" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="first-name">First Name</FieldLabel><Input {...field} id="first-name" required className="bg-background" /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller name="lastName" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="last-name">Last Name</FieldLabel><Input {...field} id="last-name" required className="bg-background" /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller name="email" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="email">Email</FieldLabel><Input {...field} id="email" type="email" required className="bg-background" /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller name="password" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="password">Password</FieldLabel><Input {...field} id="password" type="password" required className="bg-background" /><FieldDescription>Must be at least 8 characters long</FieldDescription><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller name="confirmPassword" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel><Input {...field} id="confirm-password" type="password" required className="bg-background" /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Field><Button type="submit" disabled={isLoading} form="signup-form">Create Account</Button></Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button">Continue with Apple</Button>
            <Button variant="outline" type="button">Continue with Google</Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">By signing up, you agree to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>.</FieldDescription>
    </div>
  );
}