"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { users } from "../../db/collections";
import { deleteWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { addLog } from "../logs";

const deleteAccountSchema = z.object({ userId: z.string().min(1) });

export async function deleteMemberWorkspaceAccount(input: {
  userId: string;
}): Promise<void> {
  const { userId } = deleteAccountSchema.parse(input);
  const currentUser = await requireRole("admin");
  const target = await (
    await users()
  ).findOne({
    _id: userId,
    organizationId: currentUser.organizationId,
  });

  if (!target) throw new Error("Mitglied nicht gefunden.");
  if (target.role === "admin") {
    throw new Error(
      "Admin-Accounts können nicht gelöscht werden. Ändere zuerst die Berechtigung.",
    );
  }
  if (target.workspaceAccountDeletedAt) return;

  const workspaceUserKey = target.googleWorkspaceUserId ?? target.email;
  if (!workspaceUserKey) {
    throw new Error("Für dieses Mitglied wurde kein Workspace-Konto gefunden.");
  }

  await deleteWorkspaceUser(workspaceUserKey);
  const deletedAt = Date.now();
  await (
    await users()
  ).updateOne(
    { _id: target._id, organizationId: currentUser.organizationId },
    {
      $set: { workspaceAccountDeletedAt: deletedAt },
      $unset: { googleWorkspaceUserId: "" },
    },
  );
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.workspace_account_deleted",
    target._id,
    target.name ?? target.email,
  );
}
