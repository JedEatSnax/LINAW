import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "./ui/password-input"
import { useState, type ComponentProps } from "react"
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>

export function LoginForm({ className, ...props }: ComponentProps<"div">) {
  const providerGoogle = new GoogleAuthProvider()
  const providerMicrosoft = new OAuthProvider("microsoft.com")
  const auth = getAuth()
  const navigate = useNavigate()

  const [authorizing, setAuthorizing] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const postLogin = async (email: string, firebase_uid: string) => {
    try {
      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firebase_uid }),
      })
    } catch (error) {
      console.error("Error posting login:", error)
    }
  }

  const signInEmail: FormSubmitHandler = async (e) => {
    e.preventDefault()
    setAuthorizing(true)
    setError("")

    signInWithEmailAndPassword(auth, email, password)
      .then((response) => {
        if (auth.currentUser?.emailVerified === false) {
          setAuthorizing(false)
          console.log("email not verified")
          setError(
            "Email not verified. Please check your inbox for a verification email"
          )
          return
        }
        console.log("Signed in with email and password:", response.user.uid)
        postLogin(email, auth.currentUser?.uid ?? "")
        navigate("/dashboard")
      })
      .catch((error) => {
        switch (error.code) {
          case "auth/user-not-found":
            setError("No account found with this email.")
            break
          case "auth/invalid-credential":
            setError("Invalid email or password.")
            break
          case "auth/invalid-email":
            setError("Invalid email.")
            break
          case "auth/invalid-password":
            setError("Invalid password.")
            break
          case "auth/too-many-requests":
            setError("Too many attempts. Please try again later.")
            break
          default:
            console.log("default")
            setError(error.message || "Failed to log in")
        }
        console.error("Error logging in with email and password:", error)
        setAuthorizing(false)
      })
  }

  const googleLogin = async () => {
    signInWithPopup(auth, providerGoogle)
      .then((result) => {
        const user = result.user
        console.log("Logged in with Google:", user)
        postLogin(user.email ?? "", user.uid)
        navigate("/dashboard")
      })
      .catch((error) => {
        console.error("Error logging in with Google:", error)
        setError("Failed to login in with Google")
      })
  }

  const microsoftLogin = async () => {
    signInWithPopup(auth, providerMicrosoft)
      .then((result) => {
        const user = result.user
        console.log("Logged in with Microsoft:", user)
        postLogin(user.email ?? "", user.uid)
        navigate("/dashboard")
      })
      .catch((error) => {
        console.error("Error logging in with Microsoft:", error)
        setError("Failed to login in with Microsoft")
      })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back to LINAW</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div>
              <p className="p-2 text-center text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={signInEmail}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={googleLogin}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={microsoftLogin}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M2 3h8v8H2V3zm10 0h8v8h-8V3zM2 13h8v8H2v-8zm10 0h8v8h-8v-8z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Microsoft
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authorizing}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authorizing}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={authorizing}>
                  {authorizing ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="hover:underline">
                    Register
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="/terms-of-service" className="hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  )
}
