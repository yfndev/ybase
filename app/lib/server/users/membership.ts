"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { users } from "../../db/collections";
import type { UserRole } from "../../db/types";

const roleSchema = z.enum(["admin", "finance", "people_culture", "member"]);

export async function addUserToOrganization(input: {
  userId: string;
  organizationId: string;
  role?: UserRole;
}): Promise<void> {
  const currentUser = await requireRole("admin");
  const { userId, organizationId, role } = z
    .object({
      userId: z.string(),
      organizationId: z.string(),
      role: roleSchema.optional(),
    })
    .parse(input);

  if (organizationId !== currentUser.organizationId) {
    throw new Error("Cannot add users to other organizations");
  }
  const result = await (
    await users()
  ).updateOne(
    {
      _id: userId,
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: currentUser.organizationId },
      ],
    },
    { $set: { organizationId, role: role ?? "member" } },
  );
  if (result.matchedCount !== 1) throw new Error("User not found");
}
