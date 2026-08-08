import { lazy, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import ErrorBoundary from "@/components/error-boundary"

const Hero = lazy(() => import("@/pages/Hero"))
const Login = lazy(() => import("@/pages/Login"))
const Signup = lazy(() => import("@/pages/Signup"))
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"))
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const Chatbot = lazy(() => import("@/pages/Chatbot"))
const NotFound = lazy(() => import("@/pages/NotFound"))

export function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Suspense fallback={<Skeleton />}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
