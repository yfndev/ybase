import { hasMinimumRole } from "../../auth/roles";
import { isTestMode } from "../../auth/environment";
import { requireUser } from "../../auth/session";
import {
  projects,
  receipts,
  reimbursements,
  travelDetails,
  users,
} from "../../db/collections";
import type { Receipt, Reimbursement, TravelDetails } from "../../db/types";
import { getDownloadInfo, presignDownload } from "../../s3/storage";

export async function getUserBankDetails(): Promise<{
  iban: string;
  bic: string;
  accountHolder: string;
}> {
  const user = await requireUser();
  return {
    iban: user.iban || "",
    bic: user.bic || "",
    accountHolder: user.accountHolder || user.name || "",
  };
}

export async function getReimbursement(reimbursementId: string): Promise<
  | (Reimbursement & {
      reviewedByName?: string;
      travelDetails?: TravelDetails | null;
    })
  | null
> {
  const user = await requireUser();
  const canManageReimbursements = hasMinimumRole(user.role, "finance");
  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
    organizationId: user.organizationId,
    ...(canManageReimbursements ? {} : { createdBy: user._id }),
  });
  if (!reimbursement) return null;

  const reviewer = reimbursement.reviewedBy
    ? await (await users()).findOne({ _id: reimbursement.reviewedBy })
    : null;
  const reviewedByName = reviewer?.name;

  if (reimbursement.type !== "travel") {
    return { ...reimbursement, reviewedByName };
  }

  const travel = await (await travelDetails()).findOne({ reimbursementId });
  return { ...reimbursement, reviewedByName, travelDetails: travel };
}

export async function getReceipts(reimbursementId: string): Promise<Receipt[]> {
  const user = await requireUser();
  const canManageReimbursements = hasMinimumRole(user.role, "finance");
  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
    organizationId: user.organizationId,
    ...(canManageReimbursements ? {} : { createdBy: user._id }),
  });
  if (!reimbursement) return [];

  return (await receipts()).find({ reimbursementId }).toArray();
}

export async function getFileUrl(storageId: string): Promise<string> {
  await requireUser();
  return presignDownload(storageId);
}

export async function getFileInfo(
  storageId: string,
): Promise<{ url: string; contentType: string }> {
  await requireUser();
  if (isTestMode()) {
    return {
      url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      contentType: "image/gif",
    };
  }
  return getDownloadInfo(storageId);
}

export async function getAllReimbursements(): Promise<
  Array<
    Reimbursement & {
      creatorName: string;
      projectName: string;
      travelDetails?: TravelDetails;
      reviewedByName?: string;
    }
  >
> {
  const user = await requireUser();
  const canManageReimbursements = hasMinimumRole(user.role, "finance");

  const scope = canManageReimbursements
    ? { organizationId: user.organizationId }
    : { organizationId: user.organizationId, createdBy: user._id };

  const list = await (await reimbursements())
    .find(scope)
    .sort({ _creationTime: -1 })
    .toArray();

  const creatorIds = [...new Set(list.map((item) => item.createdBy))];
  const projectIds = [...new Set(list.map((item) => item.projectId))];
  const reviewerIds = [
    ...new Set(list.map((item) => item.reviewedBy).filter(Boolean)),
  ] as string[];
  const travelIds = list
    .filter((item) => item.type === "travel")
    .map((item) => item._id);

  const [creators, projectList, reviewers, travelList] = await Promise.all([
    (await users()).find({ _id: { $in: creatorIds } }).toArray(),
    (await projects()).find({ _id: { $in: projectIds } }).toArray(),
    (await users()).find({ _id: { $in: reviewerIds } }).toArray(),
    (await travelDetails())
      .find({ reimbursementId: { $in: travelIds } })
      .toArray(),
  ]);

  const creatorMap = new Map(creators.map((item) => [item._id, item.name]));
  const projectMap = new Map(projectList.map((item) => [item._id, item.name]));
  const reviewerMap = new Map(reviewers.map((item) => [item._id, item.name]));
  const travelMap = new Map(
    travelList.map((item) => [item.reimbursementId, item]),
  );

  return list.map((item) => ({
    ...item,
    creatorName: creatorMap.get(item.createdBy) || "Unknown",
    projectName: projectMap.get(item.projectId) || "Unbekanntes Projekt",
    travelDetails: travelMap.get(item._id),
    reviewedByName: item.reviewedBy
      ? reviewerMap.get(item.reviewedBy)
      : undefined,
  }));
}
