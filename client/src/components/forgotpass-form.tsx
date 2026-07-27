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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Forgot Your Password?</CardTitle>
          <CardDescription className="text-center">
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
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" required value={email} />
            </Field>
            <Button type="submit">Send Email</Button>
            <FieldDescription className="text-center">
              Issue resolved? <a href="/login">Login</a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
