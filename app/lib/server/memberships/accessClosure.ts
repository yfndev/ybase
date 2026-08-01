import type { UpdateFilter } from "mongodb";
import { memberships, users } from "../../db/collections";
import type { Membership, User } from "../../db/types";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { terminalMemberStatus } from "../../members/termination";
import { notifyMemberStatusChange } from "../users/email";

export async function syncEndedMembershipAccess(
  membership: Membership,
): Promise<void> {
  const user = await (
    await users()
  ).findOne({
    _id: membership.userId,
    organizationId: membership.organizationId,
  });
  if (!user || user.membershipId !== membership._id) {
    await markAccessSyncNotRequired(membership._id);
    return;
  }

  const status = terminalMemberStatus(membership.endReason ?? "resignation");
  const endedAt = membership.endedAt ?? Date.now();
  const update: UpdateFilter<User> = {
    $set: {
      memberStatus: status,
      role: "member",
      ...(status === "excluded"
        ? { excludedAt: endedAt }
        : { archivedAt: endedAt }),
    },
    $unset: {
      teamId: "",
      secondaryTeamId: "",
      isTeamLead: "",
      isSecondaryTeamLead: "",
      boardMembership: "",
      ...(status === "excluded" ? { archivedAt: "" } : { excludedAt: "" }),
    },
  };
  const projected = await (
    await users()
  ).updateOne({ _id: user._id, membershipId: membership._id }, update);
  if (projected.matchedCount !== 1) return;
  await notifyMemberStatusChange({
    user,
    previous: user.memberStatus,
    next: status,
  });
  await (
    await memberships()
  ).updateOne(
    { _id: membership._id },
    { $set: { userLifecycleSyncedAt: Date.now(), updatedAt: Date.now() } },
  );
  await syncWorkspaceSuspension(membership);
}

async function syncWorkspaceSuspension(membership: Membership): Promise<void> {
  const user = await (
    await users()
  ).findOne({
    _id: membership.userId,
    organizationId: membership.organizationId,
  });
  const userKey =
    user?.membershipId === membership._id
      ? (user.googleWorkspaceUserId ?? user.email)
      : undefined;
  if (!userKey) {
    await markAccessSyncNotRequired(membership._id);
    return;
  }
  try {
    await suspendWorkspaceUser(userKey);
    await (
      await memberships()
    ).updateOne(
      { _id: membership._id },
      {
        $set: { workspaceSuspendedAt: Date.now(), updatedAt: Date.now() },
        $unset: {
          workspaceSuspensionPendingAt: "",
          workspaceSuspensionNotRequiredAt: "",
        },
      },
    );
  } catch {
    await (
      await memberships()
    ).updateOne(
      { _id: membership._id },
      {
        $set: {
          workspaceSuspensionPendingAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    );
  }
}

async function markAccessSyncNotRequired(membershipId: string): Promise<void> {
  const now = Date.now();
  await (
    await memberships()
  ).updateOne(
    { _id: membershipId },
    {
      $set: {
        userLifecycleSyncedAt: now,
        workspaceSuspensionNotRequiredAt: now,
        updatedAt: now,
      },
      $unset: { workspaceSuspensionPendingAt: "" },
    },
  );
}
