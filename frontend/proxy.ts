import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/approval-workflows",
  "/audit-trail",
  "/dashboard",
  "/organization-administration",
  "/profile",
  "/purchase-orders",
  "/purchase-requisitions",
  "/suppliers",
  "/supplier-management",
  "/supplier-portal",
  "/user-management",
];

const authRoutes = ["/forgot-password", "/login", "/reset-password", "/signup"];

const postLoginPath = "/dashboard";

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

async function hasValidSession(accessToken: string): Promise<boolean> {
  const apiUrl = (env as typeof env & { LINAW_API_URL?: string }).LINAW_API_URL;

  if (!apiUrl) {
    return false;
  }

  let cleanApiUrl = apiUrl;
  while (cleanApiUrl.endsWith("/")) {
    cleanApiUrl = cleanApiUrl.slice(0, -1);
  }

  try {
    const response = await fetch(`${cleanApiUrl}/api/auth/validate_token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function createNonce(): string {
  return btoa(crypto.randomUUID());
}

function createCsrfToken(): string {
  return btoa(crypto.randomUUID());
}

function buildCsp(nonce: string): string {
  const isDev = env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com`;
  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    script-src-elem 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://static.cloudflareinsights.com;
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https://storage.efferd.com https://www.googletagmanager.com https://static.cloudflareinsights.com;
    connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://cloudflareinsights.com https://*.cloudflareinsights.com;
    frame-src 'self' https://www.googletagmanager.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  return cspHeader.replace(/\s{2,}/g, " ").trim();
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
): NextResponse {
  const isDev = env.NODE_ENV === "production";

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );

  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function nextWithSecurityHeaders(request: NextRequest) {
  const nonce = createNonce();
  const csrfToken = createCsrfToken();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-csrf-token", csrfToken);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set("csrfToken", csrfToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
  });

  return applySecurityHeaders(response, csp);
}

function redirectWithSecurityHeaders(url: URL) {
  const nonce = createNonce();
  const csp = buildCsp(nonce);
  const response = NextResponse.redirect(url);
  return applySecurityHeaders(response, csp);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    matchesRoute(pathname, route),
  );
  const isAuthRoute = authRoutes.some((route) => matchesRoute(pathname, route));

  if (!isProtectedRoute && !isAuthRoute) {
    return nextWithSecurityHeaders(request);
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const hasSession = accessToken ? await hasValidSession(accessToken) : false;

  if (isProtectedRoute && !hasSession) {
    return redirectWithSecurityHeaders(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return redirectWithSecurityHeaders(new URL(postLoginPath, request.url));
  }

  return nextWithSecurityHeaders(request);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
