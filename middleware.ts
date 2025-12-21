import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Decode JWT without verification (for middleware route protection only)
// Full verification happens on server-side API routes
function decodeToken(token: string): { userId?: string; role?: string; isAdmin?: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// User/Customer routes (should NOT be accessible by admins)
const userRoutes = [
  "/shop",
  "/cart",
  "/checkout",
  "/products",
  "/sessions",
  "/profile",
  "/orders",
  "/home",
  "/about",
  "/services",
  "/events",
  "/blog",
  "/book",
  "/book-a-call",
  "/book-a-session",
  "/calendar",
  "/discoveryappointment",
  "/privateappointment",
  "/faq",
  "/order-confirmation",
  "/payment",
  "/form",
  "/free-studio-visit",
  "/corporate-session",
  "/shipping-and-delivery",
  "/returns-and-refund-policy",
];

// Public routes (accessible by anyone)
const publicRoutes = [
  "/login",
  "/signup",
  "/register",
  "/verify-email",
  "/resend-verification",
];

// Admin routes that require admin authentication
const adminRoutes = ["/admin/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get both user and admin tokens
  const adminTokenCookie = request.cookies.get("adminToken");
  const adminToken = adminTokenCookie?.value;
  
  const userTokenCookie = request.cookies.get("token"); // Regular users use "token" cookie
  const userToken = userTokenCookie?.value;

  // Check route types
  const isAdminRoute = pathname.startsWith("/admin/dashboard");
  const isAdminAuthRoute = pathname.startsWith("/admin/login") || pathname.startsWith("/admin/signup");
  const isUserRoute = userRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // 1. ADMIN trying to access USER ROUTES → Redirect to admin dashboard
  if (adminToken && isUserRoute) {
    console.log("🚫 Admin trying to access user route, redirecting to dashboard");
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 1b. ADMIN trying to access root path "/" → Redirect to admin dashboard
  if (adminToken && pathname === "/") {
    console.log("🚫 Admin trying to access root, redirecting to dashboard");
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 1c. ADMIN trying to access user login/signup pages → Redirect to admin dashboard
  if (adminToken && (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/register"))) {
    console.log("🚫 Admin trying to access user auth pages, redirecting to dashboard");
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 2. USER trying to access ADMIN LOGIN/SIGNUP pages → Redirect to home
  if (userToken && isAdminAuthRoute) {
    console.log("🚫 User trying to access admin login, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2b. Allow access to admin login/signup pages (if no user token)
  if (isAdminAuthRoute) {
    return NextResponse.next();
  }

  // 3. ADMIN ROUTES - Require admin authentication
  if (isAdminRoute) {
    if (!adminToken) {
      // No admin token, redirect to admin login
      console.log("🚫 No admin token, redirecting to admin login");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    
    // Verify admin token
    const adminPayload = decodeToken(adminToken);
    if (!adminPayload || (!adminPayload.isAdmin && adminPayload.role !== "admin")) {
      // Invalid or non-admin token, clear it and redirect
      console.log("🚫 Invalid admin token, redirecting to admin login");
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("adminToken");
      return response;
    }
    
    // Valid admin token, allow access
    return NextResponse.next();
  }

  // 4. USER ROUTES and PUBLIC ROUTES - Allow access (but not for admins - already handled above)
  if (isUserRoute || isPublicRoute) {
    return NextResponse.next();
  }

  // 5. Root path "/" - Allow access only if not admin (admin already redirected above)
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


