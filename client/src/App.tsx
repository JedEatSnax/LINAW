import { Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import ErrorBoundary from "@/components/error-boundary"
import { ProtectedRoute } from "@/components/protected-route"
import { lazyRoutes } from "@/routes.config"
import { Skeleton } from "./components/ui/skeleton"

const publicRoutes = [
  ["/", lazyRoutes["/"]],
  ["/login", lazyRoutes["/login"]],
  ["/signup", lazyRoutes["/signup"]],
  ["/forgot-password", lazyRoutes["/forgot-password"]],
  ["/privacy-policy", lazyRoutes["/privacy-policy"]],
  ["/terms-of-service", lazyRoutes["/terms-of-service"]],
  ["*", lazyRoutes["/not-found"]],
] as const

const protectedRoutes = [
  ["/dashboard", lazyRoutes["/dashboard"]],
  ["/assets", lazyRoutes["/assets"]],
  ["/chatbot", lazyRoutes["/chatbot"]],
] as const

/**
function AppLoadingFallback() {
  return (
    <main
      className="flex min-h-svh items-center justify-center overflow-hidden bg-[#050505]"
      aria-busy="true"
      aria-label="Loading application"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/10 bg-white/3" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-white/5" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.65)]" />
      </div>
    </main>
  )
}
 */

export function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        {/**<Suspense fallback={<AppLoadingFallback />}></Suspense>*/}
        <Suspense fallback={<Skeleton />}>
          <BrowserRouter>
            <Routes>
              {publicRoutes.map(([path, Component]) => (
                <Route
                  key={path}
                  path={path}
                  element={Component ? <Component /> : null}
                />
              ))}

              <Route element={<ProtectedRoute />}>
                {protectedRoutes.map(([path, Component]) => (
                  <Route
                    key={path}
                    path={path}
                    element={Component ? <Component /> : null}
                  />
                ))}
              </Route>
            </Routes>
          </BrowserRouter>
        </Suspense>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
