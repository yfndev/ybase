"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobPostings, teams } from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPostingStatus } from "../../db/types";
import { addLog } from "../logs";
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
  contact: optionalText,
});

const statusSchema = z.enum(["draft", "published", "closed", "archived"]);

type Content = z.infer<typeof contentSchema>;

function toDocumentFields(content: Content) {
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
    contact: content.contact ?? "",
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
  await (
    await jobPostings()
  ).updateOne({ _id: jobPostingId }, { $set: toDocumentFields(content) });
  await addLog(
    user.organizationId,
    user._id,
    "jobPosting.update",
    jobPostingId,
    content.title,
  );
}

export async function setJobPostingStatus(input: {
  jobPostingId: string;
  status: JobPostingStatus;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const { jobPostingId, status } = z
    .object({ jobPostingId: z.string(), status: statusSchema })
    .parse(input);

  await requireOwnedJobPosting(jobPostingId, user.organizationId);
  await (
    await jobPostings()
  ).updateOne({ _id: jobPostingId }, { $set: { status } });
  await addLog(
    user.organizationId,
    user._id,
    `jobPosting.status.${status}`,
    jobPostingId,
  );
}

async function requireOwnedJobPosting(
  jobPostingId: string,
  organizationId: string,
) {
  const posting = await (await jobPostings()).findOne({ _id: jobPostingId });
  if (!posting || posting.organizationId !== organizationId) {
    throw new Error("Access denied");
  }
  return posting;
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
