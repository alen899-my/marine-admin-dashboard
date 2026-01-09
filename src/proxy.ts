import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { routePermissions } from "@/lib/routePermissions";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/signin", "/signup", "/register", "/forgot-password"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const user = req.auth?.user;

  // 1. Redirect if logged in and accessing auth pages
  if (isLoggedIn && publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2. Redirect if not logged in and accessing protected pages
  if (!isLoggedIn && !publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }

  // 3. RBAC Logic
  if (isLoggedIn) {
    const requiredPermission = routePermissions[nextUrl.pathname];
    if (requiredPermission) {
      const userPermissions = (user as any).permissions || [];
      if (!userPermissions.includes(requiredPermission)) {
        return NextResponse.redirect(new URL("/403", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};