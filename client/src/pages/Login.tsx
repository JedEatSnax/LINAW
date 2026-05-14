import { LoginForm } from "@/components/login-form"
import loginImage from "@/assets/login.jpg"

export default function Login() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <img
        src={loginImage}
        loading="lazy"
        alt="Login background"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8] dark:grayscale"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  )
}
