import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.role = user.role;
        token.permissions = user.permissions;
        token.profilePicture = user.profilePicture; // ✅ Added
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.profilePicture = token.profilePicture as string | null; // ✅ Added
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;