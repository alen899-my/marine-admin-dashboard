import NextAuth from "next-auth";
import { authConfig } from "@/auth.config"; // <--- IMPORT THIS
import { NextResponse } from "next/server";

// Initialize with the config that has 'providers: []'
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

  // 2. If Not Logged In -> Block access to Dashboard
  if (!isLoggedIn && !publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }

 const routePermissions = [
  { path: "/manage-users", perm: "users.view" },
  { path: "/roles-and-permissions", perm: "roles.view" },
  { path: "/daily-noon-report", perm: "noon.view" },
  { path: "/departure-report", perm: "departure.view" },
  { path: "/arrival-report", perm: "arrival.view" },
  { path: "/nor", perm: "nor.view" },
  { path: "/cargo-stowage-cargo-documents", perm: "cargo.view" },
];

for (const route of routePermissions) {
  if (nextUrl.pathname.startsWith(route.path)) {
    if (!user?.permissions?.includes(route.perm)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }
}

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};