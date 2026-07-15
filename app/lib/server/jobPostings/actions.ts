"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobPostings, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";
import { requireOwnedJobPosting } from "./access";
import { sanitizeRichText } from "./sanitize";

const optionalText = z.string().trim().optional();

const contentSchema = z.object({
  title: z.string().trim().min(1),
  teamId: z.string().trim().min(1),
  shortText: optionalText,
  description: optionalText,
  tasks: optionalText,
  requirements: optionalText,
  timeCommitment: optionalText,
  location: optionalText,
  isRemote: z.boolean().optional(),
  deadline: optionalText,
  contactUserIds: z.array(z.string().trim().min(1)).max(20).optional(),
});

type Content = z.infer<typeof contentSchema>;

function toDocumentFields(content: Content, contactUserIds: string[]) {
  return {
    title: content.title,
    teamId: content.teamId,
    shortText: content.shortText ?? "",
    description: sanitizeRichText(content.description),
    tasks: sanitizeRichText(content.tasks),
    requirements: sanitizeRichText(content.requirements),
    timeCommitment: content.timeCommitment ?? "",
    location: content.location ?? "",
    isRemote: content.isRemote ?? false,
    deadline: content.deadline ?? "",
    contactUserIds,
  };
}

export async function createJobPostingDraft(input: {
  title: string;
  teamId: string;
}): Promise<string> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const { title, teamId } = z
    .object({
      title: z.string().trim().min(1),
      teamId: z.string().trim().min(1),
    })
    .parse(input);
  await requireActiveTeam(teamId, user.organizationId);

  const _id = newId();
  await (
    await jobPostings()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    teamId,
    status: "draft",
    title,
    createdBy: user._id,
  });
  await addLog(user.organizationId, user._id, "jobPosting.create", _id, title);
  return _id;
}

export async function updateJobPosting(
  input: { jobPostingId: string } & Content,
): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const { jobPostingId, ...content } = z
    .object({ jobPostingId: z.string(), ...contentSchema.shape })
    .parse(input);

  await requireOwnedJobPosting(jobPostingId, user.organizationId);
  await requireActiveTeam(content.teamId, user.organizationId);
  const contactUserIds = [...new Set(content.contactUserIds ?? [])];
  await requireContactMembers(contactUserIds, user.organizationId);
  await (
    await jobPostings()
  ).updateOne(
    { _id: jobPostingId },
    { $set: toDocumentFields(content, contactUserIds) },
  );
  await addLog(
    user.organizationId,
    user._id,
    "jobPosting.update",
    jobPostingId,
    content.title,
  );
}

async function requireContactMembers(
  contactUserIds: string[],
  organizationId: string,
) {
  if (contactUserIds.length === 0) return;
  const contacts = await (
    await users()
  )
    .find({
      _id: { $in: contactUserIds },
      organizationId,
      memberStatus: { $ne: "offboarded" },
    })
    .project({ _id: 1, email: 1 })
    .toArray();
  const validContactIds = new Set(
    contacts.filter((contact) => contact.email?.trim()).map(({ _id }) => _id),
  );
  if (contactUserIds.some((id) => !validContactIds.has(id))) {
    throw new Error("Ansprechpartner nicht verfügbar");
  }
}

async function requireActiveTeam(teamId: string, organizationId: string) {
  const team = await (await teams()).findOne({ _id: teamId });
  const isUsable =
    team && team.organizationId === organizationId && !team.isArchived;
  if (!isUsable) {
    throw new Error("Team nicht verfügbar");
  }
  return team;
}
