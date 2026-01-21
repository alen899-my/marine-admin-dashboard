import { dbConnect } from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import Company from "@/models/Company"; 
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
          .populate({ path: "company", model: Company })
          .lean();

          if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(
    credentials!.password as string,
    user.password as string
  );

  if (!isValid) return null;

        // Calculate Permissions
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
          profilePicture: user.profilePicture,
          permissions,
          company: user.company
            ? {
                id: user.company._id.toString(),
                name: user.company.name,
              }
            : null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Sign In (Runs only once when user logs in)
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.role = user.role;
        token.permissions = user.permissions;
        token.profilePicture = user.profilePicture;
        token.company = user.company;
      }

      // 2. Client-side Update (Triggered by update() from useSession)
      if (trigger === "update" && session?.user) {
        token.fullName = session.user.fullName;
        token.profilePicture = session.user.profilePicture;
      }

      // 3. Database Sync (Keep session data fresh with DB)
      if (token.id) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id)
            .populate({ path: "role", model: Role })
            .populate({ path: "company", model: Company })
            .lean();
          if (!dbUser || dbUser.status !== "active") {
        return null; // This effectively logs the user out
      }

          // Only sync if user exists and is active
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
            token.company = dbUser.company 
              ? {
                  id: dbUser.company._id.toString(),
                  name: dbUser.company.name,
                }
              : null;
          } else if (dbUser && dbUser.status !== "active") {
            // Optional: Force logout if user is deactivated
            return null; 
          }
        } catch (error) {
          console.error("Auth Sync Error:", error);
        }
      }

      return token;
    },
    // Ensure session callback passes token data to the client
  async session({ session, token }) {

  if (!token || !token.id) {
    return session; 
  }

  if (session.user) {
    session.user.id = token.id as string;
    session.user.fullName = token.fullName as string;
    session.user.role = token.role as string;
    session.user.permissions = token.permissions as string[];
    session.user.profilePicture = token.profilePicture as string;
    session.user.company = token.company as any;
  }

  return session;
},
  },
});