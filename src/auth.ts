import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import Role from "@/models/Role";
import { dbConnect } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        await dbConnect();
        if (!credentials?.email || !credentials?.password) return null;

        const user = await User.findOne({ email: credentials.email })
          .populate({ path: "role", model: Role })
          .lean();

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        // Calculate Permissions
        const basePerms = user.role?.permissions || [];
        const additional = user.additionalPermissions || [];
        const excluded = user.excludedPermissions || [];
        const permissions = Array.from(new Set([...basePerms, ...additional]))
          .filter((p) => !excluded.includes(p));

        return {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role?.name || "user",
          profilePicture: user.profilePicture,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Sign In
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.role = user.role;
        token.permissions = user.permissions;
        token.profilePicture = user.profilePicture;
      }

      // 2. Client-side Update (Update Profile)
      if (trigger === "update" && session?.user) {
        token.fullName = session.user.fullName;
        token.profilePicture = session.user.profilePicture;
      }

      // 3. Database Sync (Fetch fresh data every request)
      if (token.id) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id).populate("role").lean();

          if (dbUser && dbUser.status === "active") {
            const basePerms = dbUser.role?.permissions || [];
            const additional = dbUser.additionalPermissions || [];
            const excluded = dbUser.excludedPermissions || [];
            
            token.permissions = Array.from(new Set([...basePerms, ...additional]))
              .filter((p) => !excluded.includes(p));
            token.role = dbUser.role?.name || "user";
            token.fullName = dbUser.fullName;
            token.profilePicture = dbUser.profilePicture;
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error("Auth Sync Error:", error);
        }
      }

      return token;
    },
  },
});