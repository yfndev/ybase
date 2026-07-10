"use client";

import { useSession } from "next-auth/react";
import { hasMinimumRole } from "../auth/roles";
import type { UserRole } from "../db/types";

export function useCurrentUserRole(): UserRole {
  const { data } = useSession();
  return (data?.user?.role as UserRole) ?? "member";
}

export function useIsAdmin(): boolean {
  const role = useCurrentUserRole();
  return role === "admin";
}

export function useCanManageReimbursements(): boolean {
  const role = useCurrentUserRole();
  return hasMinimumRole(role, "finance");
}
