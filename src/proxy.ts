import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { routePermissions } from "@/lib/routePermissions";

const publicRoutes = ["/signin", "/signup", "/register", "/forgot-password", "/reset-password"];
const authOnlyRoutes = ["/signin", "/signup", "/register", "/forgot-password"];

function getSafeInternalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const user = req.auth?.user;

  // 0. Explicitly allow access to uploads
  if (nextUrl.pathname.startsWith('/uploads')) {
    return NextResponse.next();
  }
  const userRole = (user as any)?.role?.toLowerCase();
  if (isLoggedIn && authOnlyRoutes.includes(nextUrl.pathname)) {
    const requestedRedirect = getSafeInternalRedirect(
      nextUrl.searchParams.get("redirect"),
    );
    const redirectUrl =
      requestedRedirect && userRole === "candidate"
        ? requestedRedirect
        : userRole === "candidate"
          ? "/careers"
          : requestedRedirect || "/";
    return NextResponse.redirect(new URL(redirectUrl, nextUrl));
  }


  if (isLoggedIn && userRole === "candidate") {
    const allowedForCandidates = ["/careers", "/403", "/signin"];
    const isAllowed = allowedForCandidates.some(route =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/careers", nextUrl));
    }
  }

  // 2. Redirect if not logged in and accessing protected pages
  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) || nextUrl.pathname.startsWith("/careers");

  if (!isLoggedIn && !isPublicRoute) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public|uploads).*)"],
};
