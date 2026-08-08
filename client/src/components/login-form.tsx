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
import { useNavigate } from "react-router-dom"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()

  const loginNavigate = () => {
    navigate("/dashboard")
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
        </CardHeader>
        <CardContent>
          <form>
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
                  className="h-11 border-neutral-800 bg-[#0f0f0f] text-white placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/40"
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="h-11 bg-[#DC2626] text-white hover:bg-[#b91c1c]"
                  onClick={loginNavigate}
                >
                  Login
                </Button>
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
