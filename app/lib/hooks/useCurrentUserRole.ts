"use client";

import { useSession } from "next-auth/react";
import {
  hasPermission,
  normalizeUserRole,
  recruitingTeamIds,
  USER_PERMISSIONS,
} from "../auth/roles";
import type { UserRole } from "../db/types";

export function useCurrentUserRole(): UserRole {
  const { data } = useSession();
  return normalizeUserRole(data?.user?.role);
}

export function useIsAdmin(): boolean {
  const role = useCurrentUserRole();
  return role === "admin";
}

export function useCanManageReimbursements(): boolean {
  const role = useCurrentUserRole();
  return hasPermission(role, USER_PERMISSIONS.finance);
}

export function useCanPublishJobPostings(): boolean {
  const role = useCurrentUserRole();
  return hasPermission(role, USER_PERMISSIONS.publishJobPostings);
}

export function useRecruitingTeamIds(): string[] | null {
  const { data } = useSession();
  return recruitingTeamIds(data?.user ?? {});
}
