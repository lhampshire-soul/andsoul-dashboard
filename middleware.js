// middleware.js
// Protects all dashboard routes and API endpoints with password auth.
// Allows: /login, /api/auth, /api/canopy-webhook (webhooks need open access).
// Everything else requires a valid session cookie.

import { NextResponse } from "next/server";

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

// Edge-compatible HMAC-SHA256 using Web Crypto API
async function getExpectedToken() {
  const pw = process.env.DASHBOARD_PASSWORD || "";
  if (!pw) return null; // No password = open access
  const salt = process.env.DASHBOARD_SECRET || "andsoul-dashboard-v1";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(pw));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request) {
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
  const expectedToken = await getExpectedToken();
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
