import { dbConnect } from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import UserSession from "@/models/UserSession";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
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

        // Create a new session record
        const sessionId = crypto.randomUUID();

        let ip: string | null = null;
        let userAgent: string | null = null;
        try {
          const reqHeaders = await headers();
          const forwarded = reqHeaders.get("x-forwarded-for");
          let rawIp = forwarded ? forwarded.split(",")[0]?.trim() : reqHeaders.get("x-real-ip");
          
          if (rawIp) {
            // Strip IPv4-mapped IPv6 prefix
            if (rawIp.startsWith("::ffff:")) {
              rawIp = rawIp.substring(7);
            }
            // Normalize localhost
            if (rawIp === "::1") {
              rawIp = "127.0.0.1";
            }
            ip = rawIp;
          }
          
          const standardUa = reqHeaders.get("user-agent") ?? "";
          const secChUa = reqHeaders.get("sec-ch-ua") ?? "";
          
          if (secChUa.includes("Brave")) {
            userAgent = "Brave " + standardUa;
          } else {
            userAgent = standardUa || null;
          }
        } catch {
        }

        await UserSession.create({
          sessionId,
          userId: user._id,
          ip,
          userAgent,
        });

        return {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role?.name || "user",
          profilePicture: user.profilePicture,
          permissions,
          passwordChangedAt: user.passwordChangedAt ?? null,
          sessionId,
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
        token.passwordChangedAt = (user as any).passwordChangedAt ?? null;
        token.sessionId = (user as any).sessionId;
      }

      // 2. Client-side Update (Triggered by update() from useSession)
      if (trigger === "update" && session) {
        if (session.user?.fullName !== undefined) token.fullName = session.user.fullName;
        if (session.user?.profilePicture !== undefined) token.profilePicture = session.user.profilePicture;
        if (session.passwordChangedAt !== undefined) {
          token.passwordChangedAt = session.passwordChangedAt;
        }
        // Handle impersonation start/stop
        if (session.impersonation !== undefined) {
          token.impersonation = session.impersonation ?? null;
        }
      }

      // 3. Database Sync (Keep session data fresh with DB)
      if (token.id) {
        try {
          await dbConnect();

          if (token.sessionId) {
            const sessionDoc = await UserSession.findOne({
              sessionId: token.sessionId,
            }).lean();

            if (!sessionDoc || !sessionDoc.isValid) {
              return null;
            }

            const now = Date.now();
            const lastSeen = sessionDoc.lastSeenAt
              ? new Date(sessionDoc.lastSeenAt).getTime()
              : 0;
            if (now - lastSeen > 60_000) {
              await UserSession.updateOne(
                { sessionId: token.sessionId },
                { $set: { lastSeenAt: new Date() } }
              );
            }
          }

          const dbUser = await User.findById(token.id)
            .populate({ path: "role", model: Role })
            .populate({ path: "company", model: Company })
            .lean();
          if (!dbUser || dbUser.status !== "active") {
            return null; // This effectively logs the user out
          }

          // Force sign-out if the password was changed since the token was issued
          const dbPasswordChangedAt = dbUser.passwordChangedAt
            ? new Date(dbUser.passwordChangedAt).getTime()
            : null;
          const tokenPasswordChangedAt = token.passwordChangedAt
            ? new Date(token.passwordChangedAt as string).getTime()
            : null;
          if (dbPasswordChangedAt !== tokenPasswordChangedAt) {
            return null;
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
    async session({ session, token }) {
      if (!token?.id) {
        return { expires: session.expires } as any;
      }

      if (token.impersonation?.active) {
        // Return impersonated user's identity to the client
        session.sessionId = token.sessionId; // admin's session id (for display/audit)
        session.user = {
          id: token.impersonation.targetUserId,
          fullName: token.impersonation.targetFullName,
          email: token.impersonation.targetEmail,
          role: token.impersonation.targetRole,
          permissions: token.impersonation.targetPermissions,
          profilePicture: token.impersonation.targetProfilePicture ?? null,
          company: token.impersonation.targetCompany ?? null,
          emailVerified: null,
        } as any;
        session.impersonation = {
          active: true,
          originalAdminId: token.id,
          originalAdminName: token.fullName,
          originalAdminRole: token.role as string,
          originalAdminProfilePicture: token.profilePicture ?? null,
        };
      } else {
        // Normal session
        session.sessionId = token.sessionId as string;
        session.impersonation = null;
        if (session.user) {
          session.user.id = token.id as string;
          session.user.fullName = token.fullName as string;
          session.user.role = token.role as string;
          session.user.permissions = token.permissions as string[];
          session.user.profilePicture = token.profilePicture as string;
          session.user.company = token.company as any;
        }
      }

      return session;
    },
  },
});
