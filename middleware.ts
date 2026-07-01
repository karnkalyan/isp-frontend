import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];
const IGNORED_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/static/",
  "/images/",
  "/uploads/",
];

// Apply to every request
export const config = {
  matcher: ["/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Skip API, Next static, images, etc.
  if (IGNORED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2) Get token from cookies or authorization header
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let isAuthenticated = false;

  // 3) Just check if either token cookie exists.
  // The backend will validate its authenticity via API calls.
  // If the backend returns 401, the frontend api.ts interceptor handles logout.
  if (accessToken || refreshToken) {
    isAuthenticated = true;
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // 4) Redirect unauthenticated users trying to access private routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // You can optionally add a 'from' query param to redirect back after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5) Allow public routes regardless of authentication status
  // We avoid automatic redirects from /login to / in middleware to prevent infinite loops 
  // when cookies exist but are invalid (expired). The AuthContext on the client handles 
  // redirecting already-logged-in users if needed.
  
  // 6) All checks pass, allow the request to proceed
  return NextResponse.next();
}
