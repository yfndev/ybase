import { requireAuthenticatedUser } from "../../auth/session";
import {
  organizations,
  reimbursementInvites,
  users,
} from "../../db/collections";
import { addLog } from "../logs";
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
  if (user.memberStatus === "offboarded") {
    throw new Error("Dein Konto wurde deaktiviert");
  }

  const organization = await (
    await organizations()
  ).findOne({ _id: invite.organizationId });
  if (!organization) throw new Error("Organisation nicht gefunden");
  const email = user.email?.trim().toLowerCase();
  if (!email?.endsWith(`@${organization.domain.toLowerCase()}`)) {
    throw new Error(
      `Bitte melde dich mit einem @${organization.domain}-Konto an`,
    );
  }
  if (user.memberStatus === "active") return;

  const now = Date.now();
  const granted = await (
    await users()
  ).updateOne(
    {
      _id: user._id,
      memberStatus: { $ne: "offboarded" },
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
}
