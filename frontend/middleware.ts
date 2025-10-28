import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/workflows",
  "/runners",
  "/jobs",
  "/account",
];

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      const sessionToken = request.cookies.get(
        "better-auth.session_token"
      )?.value;

      if (!sessionToken) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }

    if (pathname === "/login") {
      const sessionToken = request.cookies.get(
        "better-auth.session_token"
      )?.value;

      if (sessionToken) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflows/:path*",
    "/runners/:path*",
    "/jobs/:path*",
    "/account/:path*",
    "/login",
  ],
};
