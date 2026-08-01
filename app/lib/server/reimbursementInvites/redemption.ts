import { requireAuthenticatedUser } from "../../auth/session";
import { reimbursementInvites, users } from "../../db/collections";
import {
  isPublicMemberStatus,
  isUnavailableMemberStatus,
  UNAVAILABLE_MEMBER_STATUSES,
} from "../../members/status";
import { YFN_ORGANIZATION } from "../../organization";
import { addLog } from "../logs";
import { notifyMemberStatusChange } from "../users/email";
import {
  hashReimbursementInviteToken,
  isReimbursementInviteToken,
} from "./token";

export async function redeemReimbursementInvite(token: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  if (!isReimbursementInviteToken(token)) throw new Error("Ungültiger Link");

  const invite = await (
    await reimbursementInvites()
  ).findOne({
    tokenHash: hashReimbursementInviteToken(token),
  });
  if (!invite) throw new Error("Dieser Einladungslink ist ungültig");
  if (user.organizationId && user.organizationId !== invite.organizationId) {
    throw new Error("Dein Konto gehört bereits zu einer anderen Organisation");
  }
  if (isUnavailableMemberStatus(user.memberStatus)) {
    throw new Error("Dein Konto wurde deaktiviert");
  }

  const email = user.email?.trim().toLowerCase();
  if (!email?.endsWith(`@${YFN_ORGANIZATION.domain}`)) {
    throw new Error(
      `Bitte melde dich mit einem @${YFN_ORGANIZATION.domain}-Konto an`,
    );
  }
  if (isPublicMemberStatus(user.memberStatus)) return;

  const now = Date.now();
  const granted = await (
    await users()
  ).updateOne(
    {
      _id: user._id,
      memberStatus: { $nin: [...UNAVAILABLE_MEMBER_STATUSES] },
      $or: [
        { organizationId: invite.organizationId },
        { organizationId: { $exists: false } },
      ],
    },
    {
      $set: {
        organizationId: invite.organizationId,
        role: "member",
        memberStatus: "active",
        teamOnboardingStatus: "completed",
        onboardedAt: now,
        teamOnboardedAt: now,
      },
    },
  );
  if (granted.matchedCount !== 1) {
    throw new Error("Dieser Zugang kann für dein Konto nicht aktiviert werden");
  }

  await addLog(
    invite.organizationId,
    user._id,
    "reimbursementInvite.redeem",
    invite._id,
    email,
  );
  await notifyMemberStatusChange({
    user,
    previous: user.memberStatus,
    next: "active",
  });
}
