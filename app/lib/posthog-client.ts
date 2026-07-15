"use client";

import { signOut } from "next-auth/react";
import posthog from "posthog-js";

export function signOutWithPostHog() {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.reset();
  }

  return signOut({ callbackUrl: "/login" });
}
