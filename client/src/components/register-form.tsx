import { useNavigate } from "react-router-dom"
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { useState, type ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "./ui/password-input"

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>

export function RegisterForm({ className, ...props }: ComponentProps<"form">) {
  const providerGoogle = new GoogleAuthProvider()
  const providerMicrosoft = new OAuthProvider("microsoft.com")
  const auth = getAuth()
  const navigate = useNavigate()
  const [authorizing, setAuthorizing] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  const registerUser: FormSubmitHandler = async (e) => {
    e.preventDefault()
    setAuthorizing(true)
    setError("")

    if (!regex.test(password)) {
      setError(
        "Password must be at least 6 characters long and include uppercase letters, lowercase letters, numbers, and special characters."
      )
      setAuthorizing(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setAuthorizing(false)
      return
    }

    try {
      const resp = await fetch(
        `/api/v1/disposable-email/${encodeURIComponent(email)}`
      )
      const data = await resp.json()
      if (data?.is_disposable) {
        setError("Disposable email addresses are not allowed")
        setAuthorizing(false)
        return
      }
    } catch (err: any) {
      console.error("Disposable email check failed:", err?.message || err)
    }

    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log("User registered:", response.user)
      postRegister(email, response.user.uid)

      await sendEmailVerification(response.user)
      console.log("Verification email sent")
      alert(
        "Registration successful! A verification email has been sent to your inbox. Please verify your email before logging in. You are being redirected to the login page."
      )

      await signOut(auth)
      navigate("/login")
    } catch (error) {
      const err = error as { code?: string; message?: string }

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Email is already in use")
          break
        case "auth/invalid-email":
          setError("Invalid email address")
          break
        case "auth/weak-password":
          setError("Password should be at least 6 characters")
          break
        default:
          setError(
            "Failed to create account: " + (err.message || "Unknown error")
          )
          console.error("Error registering user:", error)
      }
    } finally {
      setAuthorizing(false)
    }
  }

  const googleRegistration = async () => {
    signInWithPopup(auth, providerGoogle)
      .then((result) => {
        const user = result.user
        console.log("Registered with Google:", user)
        postRegister(user.email ?? "", user.uid)
        navigate("/dashboard")
      })
      .catch((error) => {
        console.error("Error registering with Google:", error)
        setError("Failed to register with Google")
      })
  }

  const microsoftRegistration = async () => {
    signInWithPopup(auth, providerMicrosoft)
      .then((result) => {
        const user = result.user
        console.log("Registered with Microsoft:", user)
        postRegister(user.email ?? "", user.uid)
        navigate("/dashboard")
      })
      .catch((error) => {
        console.error("Error registering with Microsoft:", error)
        setError("Failed to register with Microsoft")
      })
  }

  const postRegister = async (email: string, firebase_uid: string) => {
    try {
      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firebase_uid }),
      })
    } catch (error) {
      console.error("Error posting register:", error)
    }
  }
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={registerUser}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
        </div>
        {error && (
          <FieldDescription className="text-center text-red-600">
            {error}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="name">Username</FieldLabel>
          <Input id="name" type="text" required className="bg-background" />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            required
            className="bg-background"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={authorizing}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            required
            className="bg-background"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={authorizing}
          />
          <FieldDescription>
            Must be at least 6 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirm-password"
            name="password"
            required
            className="bg-background"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={authorizing}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={authorizing}>
            {authorizing ? "Registering..." : "Register"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" onClick={googleRegistration}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Sign up with Google
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={microsoftRegistration}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M2 3h8v8H2V3zm10 0h8v8h-8V3zM2 13h8v8H2v-8zm10 0h8v8h-8v-8z"
                fill="currentColor"
              />
            </svg>
            Sign up with Microsoft
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <a href="/login">Login</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
