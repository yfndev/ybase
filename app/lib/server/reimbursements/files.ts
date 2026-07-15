"use server";

import { isTestMode } from "../../auth/environment";
import { requireUser } from "../../auth/session";
import { presignUpload } from "../../s3/storage";
import { getOrganization } from "../organizations/data";
import { getProjectById } from "../projects/data";
import { registerPendingUpload } from "../uploads/ownership";
import { getFileInfo, getFileUrl, getReceipts, getReimbursement } from "./data";

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

export async function generateUploadUrl(
  contentType?: string,
): Promise<{ key: string; url: string }> {
  const user = await requireUser();
  const upload = isTestMode()
    ? { key: crypto.randomUUID(), url: "/api/test/upload" }
    : await presignUpload(contentType);
  await registerPendingUpload(upload.key, {
    organizationId: user.organizationId,
    userId: user._id,
    contextType: "user",
    contextId: user._id,
  });
  return upload;
}

export async function getFileUrlAction(key: string): Promise<string> {
  return getFileUrl(key);
}

export async function getFileInfoAction(
  key: string,
): Promise<{ url: string; contentType: string }> {
  return getFileInfo(key);
}

export async function getReimbursementPdfData(
  reimbursementId: string,
): Promise<ReimbursementPdfData | null> {
  const reimbursement = await getReimbursement(reimbursementId);
  if (!reimbursement) return null;

  const [organization, project, signatureUrl, receipts] = await Promise.all([
    getOrganization(),
    getProjectById(reimbursement.projectId),
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
    projectName: project.name,
    signatureUrl,
    receiptsWithUrls,
  };
}
