import { headers } from "next/headers";
import { LoginForm } from "@/components/forms/login";

export default async function LoginPage() {
  const csrfToken = (await headers()).get("x-csrf-token") ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm csrfToken={csrfToken} />
      </div>
    </div>
  );
}
