import { memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { HandoverTask, Membership, User } from "../../db/types";
import { notifyMemberStatusChange } from "../users/email";
import { appendMembershipEvent } from "./events";

const HANDOVER_TASKS: Array<Pick<HandoverTask, "category" | "title">> = [
  { category: "successor", title: "Nachfolge und Handover-Owner festlegen" },
  {
    category: "responsibilities",
    title: "Laufende Verantwortungen übergeben",
  },
  { category: "files", title: "Dateien und Dokumentation übergeben" },
  { category: "shared_access", title: "Geteilte Zugänge übertragen" },
  {
    category: "reimbursements",
    title: "Offene Erstattungen und Auslagen klären",
  },
  {
    category: "external_accounts",
    title: "Externe Toolkonten schließen oder übertragen",
  },
];

export async function ensureMembershipHandover(
  membership: Membership,
  startedAt: number,
  actorUserId?: string,
): Promise<boolean> {
  const member = await (
    await users()
  ).findOne({
    _id: membership.userId,
    organizationId: membership.organizationId,
    membershipId: membership._id,
  });
  if (!member) return false;

  const [lead, coordinator] = await Promise.all([
    findHandoverLead(member, membership.organizationId),
    (await users()).findOne({
      organizationId: membership.organizationId,
      role: { $in: ["people_culture", "admin"] },
      memberStatus: { $in: ["active", "offboarding_planned"] },
    }),
  ]);
  const tasks = HANDOVER_TASKS.map((task) => ({
    ...task,
    _id: newId(),
    ownerUserId: taskOwner(
      task.category,
      member._id,
      lead?._id,
      coordinator?._id,
    ),
  }));
  const result = await (
    await memberships()
  ).updateOne(
    {
      _id: membership._id,
      organizationId: membership.organizationId,
      isCurrent: true,
      legalStatus: { $in: ["active", "resigning"] },
      handoverStartedAt: { $exists: false },
    },
    {
      $set: {
        handoverStartedAt: startedAt,
        handoverTasks: tasks,
        updatedAt: startedAt,
      },
    },
  );
  const stored =
    result.modifiedCount === 1
      ? { handoverStartedAt: startedAt, handoverTasks: tasks }
      : await (
          await memberships()
        ).findOne(
          {
            _id: membership._id,
            organizationId: membership.organizationId,
            legalStatus: { $in: ["active", "resigning"] },
            handoverStartedAt: { $exists: true },
          },
          { projection: { handoverStartedAt: 1, handoverTasks: 1 } },
        );
  if (!stored?.handoverStartedAt) return false;

  const statusUpdate = await (
    await users()
  ).updateOne(
    {
      _id: member._id,
      membershipId: membership._id,
      memberStatus: { $in: ["onboarding", "active"] },
    },
    {
      $set: {
        memberStatus: "offboarding_planned",
        offboardingPlannedAt: startedAt,
      },
    },
  );
  if (statusUpdate.modifiedCount === 1) {
    await notifyMemberStatusChange({
      user: member,
      previous: member.memberStatus,
      next: "offboarding_planned",
    });
  }
  await appendMembershipEvent({
    organizationId: membership.organizationId,
    membershipId: membership._id,
    userId: membership.userId,
    actorUserId,
    actorType: actorUserId ? "user" : "system",
    type: "handover.started",
    idempotencyKey: `handover:${membership._id}:started`,
    occurredAt: stored.handoverStartedAt,
    details: { taskCount: stored.handoverTasks.length },
  });
  return result.modifiedCount === 1;
}

async function findHandoverLead(
  member: User,
  organizationId: string,
): Promise<User | null> {
  const teamIds = [member.teamId, member.secondaryTeamId].filter(
    (teamId): teamId is string => Boolean(teamId),
  );
  if (teamIds.length === 0) return null;
  return (await users()).findOne({
    organizationId,
    memberStatus: { $in: ["active", "offboarding_planned"] },
    $or: [
      { teamId: { $in: teamIds }, isTeamLead: true },
      { secondaryTeamId: { $in: teamIds }, isSecondaryTeamLead: true },
    ],
  });
}

function taskOwner(
  category: HandoverTask["category"],
  memberId: string,
  leadId?: string,
  coordinatorId?: string,
): string | undefined {
  if (category === "successor" || category === "shared_access") {
    return leadId ?? coordinatorId;
  }
  if (category === "reimbursements") return coordinatorId;
  return memberId;
}
