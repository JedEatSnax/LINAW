import { NextRequest, NextResponse } from "next/server"
import { authClient } from "./lib/auth-client"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protectedRoutes = [
    "/approval-workflows",
    "/dashboard",
    "/deliveries",
    "/invoices",
    "/organizations",
    "/profile",
    "/purchase-orders",
    "/purchase-requisitions",
    "/settings",
    "/suppliers",
    "/users",
  ]

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers: { cookie: request.headers.get("cookie") || "" },
      },
    })

    if (!session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/approval-workflows/:path*",
    "/dashboard/:path*",
    "/deliveries/:path*",
    "/invoices/:path*",
    "/organizations/:path*",
    "/profile/:path*",
    "/purchase-orders/:path*",
    "/purchase-requisitions/:path*",
    "/settings/:path*",
    "/suppliers/:path*",
    "/users/:path*",
  ],
}
