// middleware.js
// Protects all dashboard routes and API endpoints with password auth.
// Allows: /login, /api/auth, /api/canopy-webhook (webhooks need open access).
// Everything else requires a valid session cookie.

import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "andsoul_session";

// Routes that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/canopy-webhook", // Canopy sends webhooks here — must stay open
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getExpectedToken() {
  const pw = process.env.DASHBOARD_PASSWORD || "";
  if (!pw) return null; // No password = open access
  const salt = process.env.DASHBOARD_SECRET || "andsoul-dashboard-v1";
  return crypto.createHmac("sha256", salt).update(pw).digest("hex");
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets through (_next, favicon, etc.)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // If no password is configured, allow everything through
  const expectedToken = getExpectedToken();
  if (!expectedToken) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  if (sessionCookie?.value === expectedToken) {
    return NextResponse.next();
  }

  // Not authenticated — redirect pages to /login, return 401 for API routes
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Redirect to login page
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
