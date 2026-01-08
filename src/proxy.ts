import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { routePermissions } from "@/lib/routePermissions"; // Ensure this path is correct

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/signin", "/signup", "/register", "/forgot-password"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const user = req.auth?.user;

  // 1. If Logged In -> Block access to Signin/Signup
  if (isLoggedIn && publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2. If Not Logged In -> Block access to protected routes
  if (!isLoggedIn && !publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }

  // 3. RBAC Logic: Direct URL Access Protection
  if (isLoggedIn) {
    const requiredPermission = routePermissions[nextUrl.pathname];

    // If the route is in our map, check if the user has the required permission
    if (requiredPermission) {
      const userPermissions = (user as any).permissions || [];
      const hasAccess = userPermissions.includes(requiredPermission);

      if (!hasAccess) {
        // Redirect them to a 'Not Authorized' page or back to home
        return NextResponse.redirect(new URL("/403", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};