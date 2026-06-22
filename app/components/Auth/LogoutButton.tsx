"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ children }: { children: React.ReactNode }) {
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: "/login" });
  };

  return <span onClick={handleSignOut}>{children}</span>;
}
