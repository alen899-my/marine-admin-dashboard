import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    // Basic session mapping
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.profilePicture = token.profilePicture as string | null;
      }
      return session;
    },
  },
  providers: [], // Empty array, to be populated in auth.ts
} satisfies NextAuthConfig;