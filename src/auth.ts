import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import Role from "@/models/Role";
import { dbConnect } from "@/lib/db";

// 1. Update Interface
interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  profilePicture?: string | null; // ✅ Added this
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

        if (!credentials?.email || !credentials?.password) return null;

        const user = await User.findOne({ email: credentials.email })
          .populate({ path: "role", model: Role })
          .lean();

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        );

        if (!isValid) return null;

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
          profilePicture: user.profilePicture, // ✅ Pass from DB to Auth User
          permissions,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 0,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, 
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Save initial login data
      if (user) {
        token.id = user.id;
        token.profilePicture = user.profilePicture; // ✅ Save initial image
      }

      // ✅ Handle Client-side Session Updates (when you edit profile)
      if (trigger === "update" && session?.user) {
         token.fullName = session.user.fullName;
         token.profilePicture = session.user.profilePicture; // ✅ Update token immediately
      }

      if (!token.id) return token;

      // 🔄 Re-fetch from DB on every request (Syncs data)
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

      // 🔄 Update Token with fresh DB data
      token.role = dbUser.role?.name || "user";
      token.permissions = permissions;
      token.email = dbUser.email;
      token.fullName = dbUser.fullName;
      token.profilePicture = dbUser.profilePicture; // ✅ Sync image from DB

      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        
        // ✅ Pass from Token to Final Session
        session.user.profilePicture = token.profilePicture as string | null; 
      }
      return session;
    },
  },
});