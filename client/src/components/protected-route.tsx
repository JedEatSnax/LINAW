import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "@/lib/auth-client"
import type { AuthRedirectState } from "@/types/auth-redirect-state"
import { Skeleton } from "@/components/ui/skeleton"

export function ProtectedRoute() {
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <main
        className="flex min-h-svh items-center justify-center bg-[#050505]"
        aria-busy="true"
        aria-label="Checking your session"
      >
        <Skeleton className="h-2 w-32 bg-neutral-800" />
      </main>
    )
  }

  if (!session) {
    const state: AuthRedirectState = {
      from: `${location.pathname}${location.search}`,
    }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}
