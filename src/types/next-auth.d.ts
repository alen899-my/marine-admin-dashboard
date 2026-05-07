import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
    assignedVesselId?: string;
    profilePicture?: string | null;
    passwordChangedAt?: Date | null;
    sessionId?: string;
    company?: { id: string; name: string } | null;
  }

  interface Session {
    sessionId?: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      permissions: string[];
      assignedVesselName?: string;
      profilePicture?: string | null;
      company?: { id: string; name: string } | null;
    };
    // Impersonation context — present only when active
    impersonation?: {
      active: true;
      originalAdminId: string;
      originalAdminName: string;
      originalAdminRole: string;
      originalAdminProfilePicture?: string | null;
    } | null;
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
    passwordChangedAt?: Date | string | null;
    sessionId?: string;
    company?: { id: string; name: string } | null;
    // Stored snapshot of the impersonated user
    impersonation?: {
      active: true;
      targetUserId: string;
      targetFullName: string;
      targetEmail: string;
      targetRole: string;
      targetPermissions: string[];
      targetProfilePicture?: string | null;
      targetCompany?: { id: string; name: string } | null;
    } | null;
  }
}
