import { isTestMode } from "../../auth/environment";
import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
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
import { requireFileAccess } from "../uploads/access";
import { findAccessibleReimbursement } from "./access";

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
  const reimbursement = await findAccessibleReimbursement(
    reimbursementId,
    user,
  );
  if (!reimbursement) return null;

  const reviewer = reimbursement.reviewedBy
    ? await (
        await users()
      ).findOne({
        _id: reimbursement.reviewedBy,
        organizationId: user.organizationId,
      })
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
  const reimbursement = await findAccessibleReimbursement(
    reimbursementId,
    user,
  );
  if (!reimbursement) return [];

  return (await receipts()).find({ reimbursementId }).toArray();
}

export async function getFileUrl(storageId: string): Promise<string> {
  const user = await requireUser();
  await requireFileAccess(storageId, user);
  if (isTestMode()) {
    return "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
  }
  return presignDownload(storageId);
}

export async function getFileInfo(
  storageId: string,
): Promise<{ url: string; contentType: string }> {
  const user = await requireUser();
  await requireFileAccess(storageId, user);
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
      receiptSummary?: string;
      travelDetails?: TravelDetails;
      reviewedByName?: string;
    }
  >
> {
  const user = await requireUser();
  const canManageReimbursements = hasPermission(
    user.role,
    USER_PERMISSIONS.finance,
  );

  const scope = {
    organizationId: user.organizationId,
    ...(canManageReimbursements ? {} : { createdBy: user._id }),
    $or: [{ isSharedLink: { $ne: true } }, { submittedAt: { $exists: true } }],
  };

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

  const [creators, projectList, reviewers, travelList, receiptList] =
    await Promise.all([
      (await users())
        .find({
          _id: { $in: creatorIds },
          organizationId: user.organizationId,
        })
        .toArray(),
      (await projects())
        .find({
          _id: { $in: projectIds },
          organizationId: user.organizationId,
        })
        .toArray(),
      (await users())
        .find({
          _id: { $in: reviewerIds },
          organizationId: user.organizationId,
        })
        .toArray(),
      (await travelDetails())
        .find({ reimbursementId: { $in: travelIds } })
        .toArray(),
      (await receipts())
        .find({ reimbursementId: { $in: list.map((item) => item._id) } })
        .toArray(),
    ]);

  const creatorMap = new Map(creators.map((item) => [item._id, item.name]));
  const projectMap = new Map(projectList.map((item) => [item._id, item.name]));
  const reviewerMap = new Map(reviewers.map((item) => [item._id, item.name]));
  const travelMap = new Map(
    travelList.map((item) => [item.reimbursementId, item]),
  );
  const receiptsByReimbursement = new Map<string, Receipt[]>();
  for (const receipt of receiptList) {
    const reimbursementReceipts =
      receiptsByReimbursement.get(receipt.reimbursementId) ?? [];
    reimbursementReceipts.push(receipt);
    receiptsByReimbursement.set(receipt.reimbursementId, reimbursementReceipts);
  }

  return list.map((item) => {
    const itemReceipts = receiptsByReimbursement.get(item._id) ?? [];
    const firstReceipt = itemReceipts[0];
    const receiptLabel = firstReceipt?.description || firstReceipt?.companyName;
    const receiptSummary =
      receiptLabel && itemReceipts.length > 1
        ? `${receiptLabel} + ${itemReceipts.length - 1} weitere`
        : receiptLabel;

    return {
      ...item,
      creatorName: creatorMap.get(item.createdBy) || "Unbekannt",
      projectName: projectMap.get(item.projectId) || "Unbekanntes Projekt",
      receiptSummary,
      travelDetails: travelMap.get(item._id),
      reviewedByName: item.reviewedBy
        ? reviewerMap.get(item.reviewedBy)
        : undefined,
    };
  });
}
