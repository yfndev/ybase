"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import type { UserRole } from "@/lib/db/types";

interface Props {
  userId: string;
  organizationId?: string;
  role?: UserRole;
}

export function PostHogIdentity({ userId, organizationId, role }: Props) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const properties = {
      ...(organizationId ? { organization_id: organizationId } : {}),
      ...(role ? { role } : {}),
    };
    posthog.register(properties);
    posthog.identify(userId, properties);
  }, [organizationId, role, userId]);

  return null;
}
