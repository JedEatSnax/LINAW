import { headers } from "next/headers";
import { SignupForm } from "@/components/forms/signup";

export default async function SignupPage() {
  const csrfToken = (await headers()).get("x-csrf-token") ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm csrfToken={csrfToken} />
      </div>
    </div>
  );
}
