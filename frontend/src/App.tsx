import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";

import AuthRoute from "../AuthRoute";
import AuthRouteReversed from "../AuthRouteReversed";

import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { History } from "./pages/History";
import { Organizations } from "./pages/Organizations";
import { Assets } from "./pages/Assets";

function App() {
  return (
    <div className="bg-zinc-950">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              <AuthRouteReversed>
                <Login />
              </AuthRouteReversed>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRouteReversed>
                <Register />
              </AuthRouteReversed>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthRouteReversed>
                <ForgotPassword />
              </AuthRouteReversed>
            }
          />

          <Route
            path="/dashboard"
            element={
              <AuthRoute>
                <Dashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthRoute>
                <Settings />
              </AuthRoute>
            }
          />
          <Route
            path="/history"
            element={
              <AuthRoute>
                <History />
              </AuthRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <AuthRoute>
                <Organizations />
              </AuthRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <AuthRoute>
                <Assets />
              </AuthRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
