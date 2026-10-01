"use client";

import { cn } from "cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.email().min(1),
});

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  /*
    async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const { success, message } = await signIn(
      values.email,
    );

    if (success) {
      toast.success(
        `${message as string} Check your email to receive your password`,
      );
      router.push("/login");
    } else {
      toast.error(message as string);
    }

    setIsLoading(false);
  }
  */

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        id="forgot-password-form"
        //onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Recover your Account</h1>
            <FieldDescription>
              Provide your email to receive your password
            </FieldDescription>
          </div>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  required
                  className="bg-background"
                />
              </Field>
            )}
          />
          <Field>
            <Button
              type="submit"
              disabled={isLoading}
              form="forgot-password-form"
            >
              Send Email
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
