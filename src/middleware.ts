import { NextRequest, NextResponse } from "next/server";
import { verifyTokenSafe } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/checkout"];
// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];
// API routes that require admin
const ADMIN_API_ROUTES = [
  "/api/admin",
  "/api/dishes",   // POST/PATCH/DELETE
  "/api/orders",   // PATCH
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // ── Admin page protection ──────────────────────────────────────────────────
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/auth?from=admin", req.url));
    }
    const payload = await verifyTokenSafe(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/auth?from=admin", req.url));
    }
    return NextResponse.next();
  }

  // ── Protected customer pages ───────────────────────────────────────────────
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/auth?from=${encodeURIComponent(pathname)}`, req.url));
    }
    const payload = await verifyTokenSafe(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
    return NextResponse.next();
  }

  // ── Admin API protection ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    const token =
      req.cookies.get(AUTH_COOKIE_NAME)?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyTokenSafe(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── Dishes/Orders write ops require admin ──────────────────────────────────
  if (
    (pathname.startsWith("/api/dishes") && (method === "PATCH" || method === "DELETE" || method === "POST")) ||
    (pathname.match(/\/api\/orders\/\d+/) && method === "PATCH") ||
    (pathname.startsWith("/api/payments") && pathname.endsWith("/confirm"))
  ) {
    const token =
      req.cookies.get(AUTH_COOKIE_NAME)?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyTokenSafe(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── Security headers for all responses ────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/checkout/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|screenshots).*)",
  ],
};
