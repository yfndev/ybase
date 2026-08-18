"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { memberships, users } from "../../db/collections";
import { deleteWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { finalizeMembershipEnd } from "./termination";

const exclusionSchema = z.object({ userId: z.string().min(1) });

export async function excludeOfficialMember(input: {
  userId: string;
}): Promise<void> {
  const { userId } = exclusionSchema.parse(input);
  const currentUser = await requireRole("admin");
  const target = await (
    await users()
  ).findOne({ _id: userId, organizationId: currentUser.organizationId });
  if (!target) throw new Error("Mitglied nicht gefunden.");
  if (!target.membershipId) {
    throw new Error("Für dieses Mitglied wird keine Mitgliedschaft verwaltet.");
  }
  if (target._id === currentUser._id) {
    throw new Error("Der eigene Account kann nicht ausgeschlossen werden.");
  }
  await assertAnotherAdminRemains(target, currentUser.organizationId);

  const membership = await (
    await memberships()
  ).findOne({
    _id: target.membershipId,
    userId: target._id,
    organizationId: currentUser.organizationId,
    $or: [
      { isCurrent: true, legalStatus: { $ne: "ended" } },
      { isCurrent: false, legalStatus: "ended", endReason: "exclusion" },
    ],
  });
  if (!membership) throw new Error("Aktive Mitgliedschaft nicht gefunden.");

  if (membership.isCurrent) {
    await finalizeMembershipEnd(
      membership,
      "exclusion",
      Date.now(),
      currentUser._id,
    );
  }
  await deleteExcludedWorkspaceAccount(target, currentUser.organizationId);
}

async function assertAnotherAdminRemains(
  target: { _id: string; role?: string },
  organizationId: string,
): Promise<void> {
  if (target.role !== "admin") return;
  const otherAdmin = await (
    await users()
  ).findOne({
    _id: { $ne: target._id },
    organizationId,
    role: "admin",
  });
  if (!otherAdmin) {
    throw new Error(
      "Der letzte Admin kann nicht ausgeschlossen werden. Ernenne zuerst einen weiteren Admin.",
    );
  }
}

async function deleteExcludedWorkspaceAccount(
  target: {
    _id: string;
    email?: string;
    googleWorkspaceUserId?: string;
    membershipId?: string;
    workspaceAccountDeletedAt?: number;
  },
  organizationId: string,
): Promise<void> {
  if (target.workspaceAccountDeletedAt) {
    await markWorkspaceSuspensionNotRequired(
      target.membershipId,
      organizationId,
      target.workspaceAccountDeletedAt,
    );
    return;
  }
  const userKey = target.googleWorkspaceUserId ?? target.email;
  if (!userKey) {
    await markWorkspaceSuspensionNotRequired(
      target.membershipId,
      organizationId,
      Date.now(),
    );
    return;
  }

  await deleteWorkspaceUser(userKey);
  const deletedAt = Date.now();
  const [userResult] = await Promise.all([
    (await users()).updateOne(
      {
        _id: target._id,
        organizationId,
        membershipId: target.membershipId,
      },
      {
        $set: { workspaceAccountDeletedAt: deletedAt },
        $unset: { googleWorkspaceUserId: "" },
      },
    ),
    markWorkspaceSuspensionNotRequired(
      target.membershipId,
      organizationId,
      deletedAt,
    ),
  ]);
  if (userResult.matchedCount !== 1) {
    throw new Error(
      "Der gelöschte Workspace-Account konnte nicht gespeichert werden.",
    );
  }
}

async function markWorkspaceSuspensionNotRequired(
  membershipId: string | undefined,
  organizationId: string,
  recordedAt: number,
) {
  const result = await (
    await memberships()
  ).updateOne(
    {
      _id: membershipId,
      organizationId,
      legalStatus: "ended",
      endReason: "exclusion",
    },
    {
      $set: {
        workspaceSuspensionNotRequiredAt: recordedAt,
        updatedAt: recordedAt,
      },
      $unset: {
        workspaceSuspendedAt: "",
        workspaceSuspensionPendingAt: "",
      },
    },
  );
  if (result.matchedCount !== 1) {
    throw new Error(
      "Der gelöschte Workspace-Account konnte nicht gespeichert werden.",
    );
  }
}
