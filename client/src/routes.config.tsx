import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const routeConfig = {
  "/": () => import("@/pages/Hero"),
  "/login": () => import("@/pages/Login"),
  "/signup": () => import("@/pages/Signup"),
  "/forgot-password": () => import("@/pages/ForgotPassword"),
  "/privacy-policy": () => import("@/pages/PrivacyPolicy"),
  "/terms-of-service": () => import("@/pages/TermsOfService"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/assets": () => import("@/pages/Assets"),
  "/chatbot": () => import("@/pages/Chatbot"),
  "/not-found": () => import("@/pages/NotFound"),
} as const

type LazyRouteMap = Record<string, LazyExoticComponent<ComponentType<any>>>

export const lazyRoutes = Object.fromEntries(
  Object.entries(routeConfig).map(([path, loader]) => [path, lazy(loader)])
) as LazyRouteMap

export const preloadMap = new Map<string, () => Promise<unknown>>(
  Object.entries(routeConfig) as [string, () => Promise<unknown>][]
)
