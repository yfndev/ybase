import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
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
import { requireFileAccess } from "../uploads/access";

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
  const canManageReimbursements = hasPermission(
    user.role,
    USER_PERMISSIONS.finance,
  );

  const filter = canManageReimbursements
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

  const organization = await (
    await organizations()
  ).findOne({
    _id: user.organizationId,
  });
  const creators = await (
    await users()
  )
    .find({
      _id: { $in: creatorIds },
      organizationId: user.organizationId,
    })
    .toArray();
  const projectDocs = await (
    await projects()
  )
    .find({
      _id: { $in: projectIds },
      organizationId: user.organizationId,
    })
    .toArray();
  const reviewers = await (
    await users()
  )
    .find({
      _id: { $in: reviewerIds },
      organizationId: user.organizationId,
    })
    .toArray();

  const creatorMap = new Map(
    creators.map((creator) => [creator._id, creator.name]),
  );
  const projectMap = new Map(
    projectDocs.map((project) => [project._id, project.name]),
  );
  const reviewerMap = new Map(
    reviewers.map((reviewer) => [reviewer._id, reviewer.name]),
  );

  return completed.map((item) => ({
    ...item,
    creatorName: creatorMap.get(item.createdBy) || "Unknown",
    projectName: projectMap.get(item.projectId) || "Unknown",
    organizationName: organization?.name || "",
    organizationStreet: organization?.street || "",
    organizationPlz: organization?.plz || "",
    organizationCity: organization?.city || "",
    reviewedByName: item.reviewedBy
      ? reviewerMap.get(item.reviewedBy)
      : undefined,
  }));
}

export async function get(id: string): Promise<VolunteerAllowance | null> {
  const user = await requireUser();
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) return null;
  return doc;
}

export async function getSignatureUrl(storageId: string): Promise<string> {
  const user = await requireUser();
  await requireFileAccess(storageId, user);
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

  const organization = await (
    await organizations()
  ).findOne({
    _id: doc.organizationId,
  });
  const creator = await (
    await users()
  ).findOne({ _id: doc.createdBy, organizationId: doc.organizationId });
  const project = await (
    await projects()
  ).findOne({ _id: doc.projectId, organizationId: doc.organizationId });

  if (!organization || !creator || !project) return null;

  return { ...doc, organization, creator, project };
}
