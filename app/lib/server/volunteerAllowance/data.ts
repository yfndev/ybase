import { requireUser } from "../../auth/session";
import {
  organizations,
  projects,
  users,
  volunteerAllowance,
} from "../../db/collections";
import type {
  Organization,
  Project,
  User,
  VolunteerAllowance,
} from "../../db/types";
import { presignDownload } from "../../s3/storage";

export type VolunteerAllowanceWithNames = VolunteerAllowance & {
  creatorName: string;
  projectName: string;
  organizationName: string;
  organizationStreet: string;
  organizationPlz: string;
  organizationCity: string;
  reviewedByName?: string;
};

export async function getAll(): Promise<VolunteerAllowanceWithNames[]> {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const filter = isAdmin
    ? { organizationId: user.organizationId }
    : { organizationId: user.organizationId, createdBy: user._id };

  const items = await (await volunteerAllowance())
    .find(filter)
    .sort({ _creationTime: -1 })
    .toArray();

  const completed = items.filter((item) => item.signatureStorageId);

  const creatorIds = [...new Set(completed.map((item) => item.createdBy))];
  const projectIds = [...new Set(completed.map((item) => item.projectId))];
  const reviewerIds = [
    ...new Set(
      completed
        .map((item) => item.reviewedBy)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const organization = await (await organizations()).findOne({
    _id: user.organizationId,
  });
  const creators = await (await users())
    .find({ _id: { $in: creatorIds } })
    .toArray();
  const projectDocs = await (await projects())
    .find({ _id: { $in: projectIds } })
    .toArray();
  const reviewers = await (await users())
    .find({ _id: { $in: reviewerIds } })
    .toArray();

  const creatorMap = new Map(creators.map((creator) => [creator._id, creator.name]));
  const projectMap = new Map(projectDocs.map((project) => [project._id, project.name]));
  const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer._id, reviewer.name]));

  return completed.map((item) => ({
    ...item,
    creatorName: creatorMap.get(item.createdBy) || "Unknown",
    projectName: projectMap.get(item.projectId) || "Unknown",
    organizationName: organization?.name || "",
    organizationStreet: organization?.street || "",
    organizationPlz: organization?.plz || "",
    organizationCity: organization?.city || "",
    reviewedByName: item.reviewedBy ? reviewerMap.get(item.reviewedBy) : undefined,
  }));
}

export async function get(id: string): Promise<VolunteerAllowance | null> {
  const user = await requireUser();
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) return null;
  return doc;
}

export async function getSignatureUrl(storageId: string): Promise<string> {
  await requireUser();
  return presignDownload(storageId);
}

export type VolunteerAllowanceWithDetails = VolunteerAllowance & {
  organization: Organization;
  creator: User;
  project: Project;
};

export async function getWithDetails(
  id: string,
): Promise<VolunteerAllowanceWithDetails | null> {
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc) return null;

  const organization = await (await organizations()).findOne({
    _id: doc.organizationId,
  });
  const creator = await (await users()).findOne({ _id: doc.createdBy });
  const project = await (await projects()).findOne({ _id: doc.projectId });

  if (!organization || !creator || !project) return null;

  return { ...doc, organization, creator, project };
}
