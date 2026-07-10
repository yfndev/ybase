"use server";

import { z } from "zod";
import { requireRole, requireUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { UserRole } from "../../db/types";
import { addLog } from "../logs";

const roleSchema = z.enum(["admin", "finance", "member"]);

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

  const result = await (await users()).updateOne(
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
  if (targetUser.organizationId !== currentUser.organizationId)
    throw new Error("Access denied");

  if (targetUser.role === "admin" && role !== "admin") {
    const admins = await (await users())
      .find({ organizationId: currentUser.organizationId, role: "admin" })
      .limit(2)
      .toArray();
    if (admins.length <= 1)
      throw new Error(
        "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
      );
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

export async function updateBankDetails(input: {
  iban: string;
  bic: string;
  accountHolder: string;
}): Promise<void> {
  const user = await requireUser();
  const { iban, bic, accountHolder } = z
    .object({
      iban: z.string(),
      bic: z.string(),
      accountHolder: z.string(),
    })
    .parse(input);

  await (await users()).updateOne(
    { _id: user._id },
    { $set: { iban, bic, accountHolder } },
  );
}
