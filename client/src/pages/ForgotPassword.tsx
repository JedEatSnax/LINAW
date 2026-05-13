import { ForgotPassForm } from "@/components/forgotpass-form";
import loginImage from "@/assets/login.jpg"

export default function ForgotPassword() {
  return (
  <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <img
        src={loginImage}
        loading="lazy"
        alt="Login background"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8] dark:grayscale"
      />
    <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
      <ForgotPassForm />
    </div>
  </div>
)
}
