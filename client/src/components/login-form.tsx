import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { PasswordInput } from "@/components/ui/password-input"
import { authClient } from "@/lib/auth-client"
import { z } from "zod"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { AuthRedirectState } from "@/types/auth-redirect-state"

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loginSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter your credentials")
      return
    }

    setIsSubmitting(true)
    const { error: signInError } = await authClient.signIn.email({
      email: result.data.email,
      password: result.data.password,
    })
    setIsSubmitting(false)

    if (signInError) {
      setError(
        signInError.message || "Unable to sign in with those credentials"
      )
      return
    }

    const destination = (location.state as AuthRedirectState | null)?.from
    navigate(destination || "/dashboard", { replace: true })
  }

  return (
    <div
      className={cn("flex flex-col gap-6 text-white", className)}
      style={{ colorScheme: "dark" }}
      {...props}
    >
      <Card className="border-neutral-800! bg-[#111111]! text-white! shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold text-white">
            Login to your account
          </CardTitle>
          <CardDescription className="text-center text-neutral-400!">
            Enter your email below to login to your account
          </CardDescription>
          {typeof (location.state as AuthRedirectState | null)
            ?.signupSuccess === "string" && (
            <p className="text-center text-sm text-green-400" role="status">
              {(location.state as AuthRedirectState).signupSuccess}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={loginSubmit} noValidate>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel
                  htmlFor="email"
                  className="text-sm text-neutral-200"
                >
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 border-neutral-800 bg-[#0f0f0f] text-white placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/40"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel
                    htmlFor="password"
                    className="text-sm text-neutral-200"
                  >
                    Password
                  </FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-xs text-neutral-400 underline-offset-4 hover:text-white hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 border-neutral-800 bg-[#0f0f0f] text-white placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/40"
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 bg-[#DC2626] text-white hover:bg-[#b91c1c]"
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                </Button>
                {error && (
                  <p role="alert" className="text-center text-sm text-red-400">
                    {error}
                  </p>
                )}
                <FieldDescription className="text-center text-neutral-400">
                  Don&apos;t have an account?{" "}
                  <a
                    href="/signup"
                    className="font-semibold text-[#DC2626] hover:underline"
                  >
                    Signup
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
