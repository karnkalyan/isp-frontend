import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login", "/forgot-password"];
const IGNORED_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/static/",
  "/images/",
  "/uploads/",
];

// This secret must be stored securely as an environment variable
// and must be the SAME secret as your backend's ACCESS_SECRET.
const ACCESS_SECRET = process.env.NEXT_PUBLIC_ACCESS_SECRET;

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
  const token = request.cookies.get("access_token")?.value;

  let isAuthenticated = false;

  // 3) If a token exists, VERIFY it
  if (token) {
    if (!ACCESS_SECRET) {
      console.error("Missing ACCESS_SECRET environment variable");
      // In a real app, you might want to handle this more gracefully
      // For now, we'll treat it as unauthenticated.
      isAuthenticated = false;
    } else {
      try {
        // Encode the secret for 'jose' library
        const secret = new TextEncoder().encode(ACCESS_SECRET);

        // Verify the token's signature and expiration
        await jwtVerify(token, secret);
        
        // If jwtVerify does not throw an error, the token is valid.
        isAuthenticated = true;
      } catch (err:any) {
        // Token is invalid (expired, tampered, etc.)
        console.warn("JWT verification failed:", err.message);
        isAuthenticated = false;
      }
    }
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

  // 5) Redirect authenticated users away from public routes (e.g., /login)
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  // 6) All checks pass, allow the request to proceed
  return NextResponse.next();
}
