import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {

  interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
    profilePicture?: string | null; // ✅ Add this
    company?: {
      id: string;
      name: string;
    } | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      permissions: string[];
      profilePicture?: string | null;
      company?: {
        id: string;
        name: string;
      } | null;
    };
  }
}

declare module "next-auth/jwt" {

  interface JWT {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
    profilePicture?: string | null;
    company?: {
      id: string;
      name: string;
    } | null;
  }
}
