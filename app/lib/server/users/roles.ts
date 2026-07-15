"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { users } from "../../db/collections";
import type { UserRole } from "../../db/types";
import { addLog } from "../logs";

const roleSchema = z.enum(["admin", "finance", "people_culture", "member"]);

export async function updateUserRole(input: {
  userId: string;
  role: UserRole;
}): Promise<void> {
  const currentUser = await requireRole("admin");
  const { userId, role } = z
    .object({ userId: z.string(), role: roleSchema })
    .parse(input);
  const targetUser = await (await users()).findOne({ _id: userId });
  if (!targetUser) throw new Error("User not found");
  if (targetUser.organizationId !== currentUser.organizationId) {
    throw new Error("Access denied");
  }

  if (targetUser.role === "admin" && role !== "admin") {
    const admins = await (await users())
      .find({ organizationId: currentUser.organizationId, role: "admin" })
      .limit(2)
      .toArray();
    if (admins.length <= 1) {
      throw new Error(
        "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
      );
    }
  }

  const oldRole = targetUser.role ?? "member";
  await (await users()).updateOne({ _id: userId }, { $set: { role } });
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "user.role_change",
    userId,
    `${targetUser.name ?? targetUser.email}: ${oldRole} → ${role}`,
  );
}
