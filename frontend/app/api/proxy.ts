import { NextResponse, NextRequest } from "next/server";

const ProtectedRoutes = [
  "/dashboard",
  "/settings",
  "/dashboard",
  "/approval-workflow",
  "/deliveries",
  "/invoices",
  "/organizations",
  "/suppliers",
  "/purchase-orders",
  "/purchase-requisitions",
  "/users",
];
const AuthRoute = ["/login", "/signup", "/forgot-password"];

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = ProtectedRoutes.some((route) =>
    path.startsWith(route),
  );
  const isAuthRoute = AuthRoute.some((route) => path.startsWith(route));

  const cookie = req.cookies.get("auth_token");
  const session = cookie ? cookie.value : null;

  if (isProtectedRoute && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
