import type { z } from "zod";
import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
import { reimbursements, travelDetails } from "../../db/collections";
import { newId } from "../../db/ids";
import type { UserRole } from "../../db/types";
import { getOrganization } from "../organizations/data";
import { getProjectById } from "../projects/data";
import { addLog } from "../logs";
import { getFileUrl, getReceipts, getReimbursement } from "./data";
import { cleanupReimbursement } from "./helpers";
import type { createTravelReimbursementSchema } from "./validators";

type ReviewActor = { _id: string; organizationId: string; role: UserRole };

export type ReimbursementPdfData = {
  reimbursement: Awaited<ReturnType<typeof getReimbursement>>;
  organization: Awaited<ReturnType<typeof getOrganization>>;
  projectName: string;
  signatureUrl: string | null;
  receiptsWithUrls: Array<
    Awaited<ReturnType<typeof getReceipts>>[number] & {
      fileUrl: string | null;
    }
  >;
};

export async function insertTravelDetails(
  reimbursementId: string,
  args: z.infer<typeof createTravelReimbursementSchema>,
): Promise<void> {
  await (
    await travelDetails()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    reimbursementId,
    startDate: args.startDate,
    startTime: args.startTime,
    endDate: args.endDate,
    endTime: args.endTime,
    destination: args.destination,
    purpose: args.purpose,
    isInternational: args.isInternational,
    mealAllowanceDays: args.mealAllowanceDays,
    mealAllowanceDailyBudget: args.mealAllowanceDailyBudget,
    mealAllowance: args.mealAllowance,
    overnightAllowanceNights: args.overnightAllowanceNights,
    overnightAllowanceRate: args.overnightAllowanceRate,
  });
}

export async function buildReimbursementPdfData(
  reimbursementId: string,
): Promise<ReimbursementPdfData | null> {
  const reimbursement = await getReimbursement(reimbursementId);
  if (!reimbursement) return null;

  const projectPromise =
    reimbursement.type === "travel"
      ? getProjectById(reimbursement.projectId)
      : Promise.resolve(null);
  const [organization, project, signatureUrl, receipts] = await Promise.all([
    getOrganization(),
    projectPromise,
    reimbursement.signatureStorageId
      ? getFileUrl(reimbursement.signatureStorageId)
      : Promise.resolve(null),
    getReceipts(reimbursementId),
  ]);
  const receiptsWithUrls = await Promise.all(
    receipts.map(async (receipt) => ({
      ...receipt,
      fileUrl: receipt.fileStorageId
        ? await getFileUrl(receipt.fileStorageId)
        : null,
    })),
  );

  return {
    reimbursement,
    organization,
    projectName: project?.name ?? "",
    signatureUrl,
    receiptsWithUrls,
  };
}

export async function deleteReimbursementById(
  reimbursementId: string,
  user: ReviewActor,
): Promise<void> {
  const reimbursement = await (
    await reimbursements()
  ).findOne({ _id: reimbursementId });

  if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
    throw new Error("Reimbursement not found");
  }

  const canManageReimbursements = hasPermission(
    user.role,
    USER_PERMISSIONS.finance,
  );
  if (reimbursement.createdBy !== user._id && !canManageReimbursements) {
    throw new Error("Only the creator or finance can delete reimbursements");
  }

  await cleanupReimbursement(reimbursement);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.delete",
    reimbursementId,
    `${reimbursement.amount}€`,
  );
}

export async function applyApproval(
  reimbursementId: string,
  reviewerId: string,
): Promise<void> {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "", rejectionNote: "" },
    },
  );
}

export async function applyDecline(
  reimbursementId: string,
  reviewerId: string,
  rejectionNote: string,
): Promise<void> {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "declined",
        rejectionNote,
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "" },
    },
  );
}

export async function applyChangesRequest(
  reimbursementId: string,
  reviewerId: string,
  reviewNote: string,
): Promise<void> {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "changes_requested",
        reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
        isSharedLink: true,
      },
      $unset: { rejectionNote: "" },
    },
  );
}
