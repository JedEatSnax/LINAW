"use client";

import { cn } from "cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormValues } from "@/validators/auth";
import { markAuthTransition, runAuthTransition } from "@/lib/auth-client";

function getSafeReturnTo() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/invitations/accept?token=") ? value : null;
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const safeReturnTo = getSafeReturnTo();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const { response, data } = await runAuthTransition(async () => {
        const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
        const data = (await response.json()) as { success?: boolean; message?: string };
        if (response.ok && data.success === true) markAuthTransition();
        return { response, data };
      });
      if (!response.ok || data.success !== true) {
        form.setError("root", { message: data.message ?? "Login failed. Please try again." });
        return;
      }
      router.push(safeReturnTo ?? "/dashboard");
    } catch {
      form.setError("root", { message: "Unable to reach the login service. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome to LINAW</h1>
            <FieldDescription>Don&apos;t have an account? <a href={safeReturnTo ? `/signup?returnTo=${encodeURIComponent(safeReturnTo)}` : "/signup"}>Sign up</a></FieldDescription>
          </div>
          <Controller name="email" control={form.control} render={({ field }) => <Field><FieldLabel htmlFor="email">Email</FieldLabel><Input {...field} id="email" type="email" required className="bg-background" /></Field>} />
          <Controller name="password" control={form.control} render={({ field }) => <Field><div className="flex items-center"><FieldLabel htmlFor="password">Password</FieldLabel><a href="/forgot-password" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">Forgot your password?</a></div><Input {...field} id="password" type="password" required className="bg-background" /></Field>} />
          <Field><Button type="submit" disabled={isLoading} form="login-form">Login</Button></Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button">Continue with Apple</Button>
            <Button variant="outline" type="button">Continue with Google</Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">By logging in, you agree to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>.</FieldDescription>
    </div>
  );
}