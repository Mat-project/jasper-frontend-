/**
 * Next.js Route Middleware — Protected route enforcement.
 *
 * Redirects unauthenticated users from protected routes to /login.
 * Redirects authenticated users from /login back to /dashboard.
 */
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIX = ["/dashboard", "/employees", "/projects", "/attendance"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Check for access token in cookies
  const token = request.cookies.get("eoms_access")?.value;
  const isAuthenticated = !!token;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_PREFIX.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Redirect authenticated users away from login page
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
