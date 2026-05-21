import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"


const AuthenticationRoute = lazy(() => import("./pages/AuthenticationRoute"))
const AuthenticationRouteReversed = lazy(
  () => import("./pages/AuthenticationRouteReversed")
)
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const TermsOfService = lazy(() => import("./pages/TermsOfService"))
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"))
const Organizations = lazy(() => import("./pages/Organizations"))
const SmartContracts = lazy(() => import("./pages/SmartContracts"))
const Analytics = lazy(() => import("./pages/Analytics"))
const Asset = lazy(() => import("./pages/AssetRegistry"))
const Submissions = lazy(() => import("./pages/ApprovalWorkflow"))
const Blockchain = lazy(() => import("./pages/BlockchainNetworks"))
const Account = lazy(() => import("./pages/Account"))
const Settings = lazy(() => import("./pages/Settings"))
const Members = lazy(() => import("./pages/AddUser"))

export function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Suspense fallback={<Skeleton />}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/login"
              element={
                <AuthenticationRouteReversed>
                  <Login />
                </AuthenticationRouteReversed>
              }
            />
            <Route
              path="/register"
              element={
                <AuthenticationRouteReversed>
                  <Register />
                </AuthenticationRouteReversed>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthenticationRouteReversed>
                  <ForgotPassword />
                </AuthenticationRouteReversed>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthenticationRoute>
                  <Dashboard />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <AuthenticationRoute>
                  <Organizations />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/smart-contracts"
              element={
                <AuthenticationRoute>
                  <SmartContracts />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <AuthenticationRoute>
                  <Analytics />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/asset"
              element={
                <AuthenticationRoute>
                  <Asset />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <AuthenticationRoute>
                  <Submissions />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/networks"
              element={
                <AuthenticationRoute>
                  <Blockchain />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/account"
              element={
                <AuthenticationRoute>
                  <Account />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthenticationRoute>
                  <Settings />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/members"
              element={
                <AuthenticationRoute>
                  <Members />
                </AuthenticationRoute>
              }
            />
            <Route
              path="/add-user"
              element={
                <AuthenticationRoute>
                  <Members />
                </AuthenticationRoute>
              }
            />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </TooltipProvider>
  )
}

export default App
