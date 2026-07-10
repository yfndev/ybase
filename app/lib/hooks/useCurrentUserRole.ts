"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "../db/types";

export function useCurrentUserRole(): UserRole {
  const { data } = useSession();
  return (data?.user?.role as UserRole) ?? "member";
}

export function useIsAdmin(): boolean {
  const role = useCurrentUserRole();
  return role === "admin";
}
