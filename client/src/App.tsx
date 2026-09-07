import { Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import ErrorBoundary from "@/components/error-boundary"
import { ProtectedRoute } from "@/components/protected-route"
import { lazyRoutes } from "@/routes.config"
import { Spinner } from "@/components/ui/spinner"

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

export function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Suspense
          fallback={
            <div className="flex min-h-svh items-center justify-center">
              <Spinner className="size-10" />
            </div>
          }
        >
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
