import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ForgotPassForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [email] = useState("")
  const [error] = useState("")
  const [success] = useState(false)
  return (
    <div
      className={cn("flex flex-col gap-6 text-white", className)}
      style={{ colorScheme: "dark" }}
      {...props}
    >
      <Card className="border-neutral-800 bg-[#111111] text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-white">
            Forgot Your Password?
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Enter your email to receive a password reset link
            {error && (
              <p className="p-2 text-center text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="p-2 text-center text-sm text-green-600">
                Password reset email sent successfully!
                <br /> Check your Spam if the email isn't visible
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="email" className="text-sm text-neutral-200">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                className="h-11 border-neutral-800 bg-[#0f0f0f] text-white placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/40"
              />
            </Field>
            <Button
              type="submit"
              className="h-11 bg-[#DC2626] text-white hover:bg-[#b91c1c]"
            >
              Send Email
            </Button>
            <FieldDescription className="text-center text-neutral-400">
              Issue resolved?{" "}
              <a
                href="/login"
                className="font-semibold text-[#DC2626] hover:underline"
              >
                Login
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
