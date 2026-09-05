import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "@/lib/auth-client"
import { preloadMap } from "@/routes.config"
import type { AuthRedirectState } from "@/types/auth-redirect-state"

const protectedRoutePaths = ["/dashboard", "/assets", "/chatbot"]

export function ProtectedRoute() {
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!session) return

    for (const path of protectedRoutePaths) {
      preloadMap
        .get(path)?.()
        .catch(() => undefined)
    }
  }, [session])

  if (isPending && !session) {
    return (
      <main
        className="flex min-h-svh items-center justify-center bg-[#050505]"
        aria-busy="true"
        aria-label="Checking your session"
      />
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
