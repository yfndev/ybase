"use client";

import { useSession } from "next-auth/react";

export type UserRole = "admin" | "lead" | "member";

export function useCurrentUserRole(): UserRole | undefined {
  const { data } = useSession();
  return (data?.user?.role as UserRole) ?? "member";
}

export function useCanEdit(): boolean {
  const role = useCurrentUserRole();
  return role === "lead" || role === "admin";
}

export function useIsAdmin(): boolean {
  const role = useCurrentUserRole();
  return role === "admin";
}

export function useCanViewAllTransactions(): boolean {
  const role = useCurrentUserRole();
  return role === "admin";
}
