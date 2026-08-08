import { ForgotPassForm } from "@/components/forgotpass-form"
import signupBg from "@/assets/signup.avif"

export default function ForgotPassword() {
  return (
    <div
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      style={{ backgroundImage: `url(${signupBg})` }}
    >
      <div className="w-full max-w-sm">
        <ForgotPassForm />
      </div>
    </div>
  )
}
