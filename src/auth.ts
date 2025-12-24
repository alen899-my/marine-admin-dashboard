import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import Role from "@/models/Role";
import { dbConnect } from "@/lib/db";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        await dbConnect();

        // 1. Check if fields exist
        if (!credentials?.email || !credentials?.password) return null;

        // 2. Fetch user
        const user = await User.findOne({ email: credentials.email })
          .populate({ path: "role", model: Role })
          .lean();

        if (!user) return null;

        // 3. Validate password
        // 🔴 FIX: Cast credentials.password to string here
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        );

        if (!isValid) return null;

        // ✅ Build permissions
        const basePerms = user.role?.permissions || [];
        const additional = user.additionalPermissions || [];
        const excluded = user.excludedPermissions || [];

        const permissions = Array.from(
          new Set([...basePerms, ...additional])
        ).filter((p) => !excluded.includes(p));

        return {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role?.name || "user",
          permissions,
        };
      },
    }),
  ],
  // ✅ SESSION CONFIG (7 DAYS + IMMEDIATE UPDATE)
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 0,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    // 🔥 RUNS ON EVERY REQUEST
    async jwt({ token, user }) {
      // Save ID on first login
      if (user) {
        token.id = user.id;
      }

      if (!token.id) return token;

      await dbConnect();
      const dbUser = await User.findById(token.id).populate("role");

      if (!dbUser || dbUser.status !== "active") {
        return null;
      }

      const basePerms = dbUser.role?.permissions || [];
      const additional = dbUser.additionalPermissions || [];
      const excluded = dbUser.excludedPermissions || [];

      const permissions = Array.from(
        new Set([...basePerms, ...additional])
      ).filter((p) => !excluded.includes(p));

      // 🔄 Always overwrite token
      token.role = dbUser.role?.name || "user";
      token.permissions = permissions;
      token.email = dbUser.email;
      token.fullName = dbUser.fullName;

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
});