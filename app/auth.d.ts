import type { MemberStatus, UserRole } from "@/lib/db/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      role?: UserRole;
      memberStatus?: MemberStatus;
    } & DefaultSession["user"];
  }

  interface User {
    firstName?: string;
    lastName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    organizationId?: string;
    role?: UserRole;
    memberStatus?: MemberStatus;
  }
}
