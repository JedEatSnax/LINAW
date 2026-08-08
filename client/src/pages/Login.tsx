import { LoginForm } from "@/components/login-form"
import loginBg from "@/assets/login.avif"

export default function Login() {
  return (
    <div
      className="flex min-h-svh w-full items-center justify-center bg-cover bg-center bg-no-repeat p-6 md:p-10"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
