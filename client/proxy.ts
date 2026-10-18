import { NextRequest, NextResponse } from "next/server"

const authURL = process.env["NEXT_PUBLIC_BETTER_AUTH_URL"]

export async function proxy(request: NextRequest) {
  const cookie = request.headers.get("cookie")
  const authorization = request.headers.get("authorization")

  if (!cookie && !authorization) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const sessionResponse = await fetch(`${authURL}/api/auth/get-session`, {
    method: "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(authorization ? { authorization } : {}),
    },
    cache: "no-store",
  })

  if (!sessionResponse.ok) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const session = await sessionResponse.json()
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url))
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
