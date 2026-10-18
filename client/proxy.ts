import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { authClient } from "./lib/auth-client"

const protectedRoutes = [
  "/approval-workflows",
  "/dashboard",
  "/deliveries",
  "/invoices",
  "/organizations",
  "/purchase-orders",
  "/purchase-requisitions",
  "/settings",
  "/suppliers",
  "/users",
]

const authRoutes = ["/forgot-password", "/login", "/reset-password", "/signup"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers: request.headers,
      },
    })

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    })

    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/forgot-password/:path*",
    "/login/:path*",
    "/reset-password/:path*",
    "/signup/:path*",
    "/approval-workflows/:path*",
    "/dashboard/:path*",
    "/deliveries/:path*",
    "/invoices/:path*",
    "/organizations/:path*",
    "/purchase-orders/:path*",
    "/purchase-requisitions/:path*",
    "/settings/:path*",
    "/suppliers/:path*",
    "/users/:path*",
  ],
}
