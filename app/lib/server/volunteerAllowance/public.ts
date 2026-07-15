import type { z } from "zod";
import {
  organizations,
  projects,
  volunteerAllowance,
} from "../../db/collections";
import { presignUpload } from "../../s3/storage";
import type { volunteerAllowanceSubmissionSchema } from "../../volunteerAllowance/schemas";
import { addLog } from "../logs";
import {
  claimPendingUploads,
  registerPendingUpload,
} from "../uploads/ownership";
import { sendSubmissionReceivedEmail } from "./email";

type AllowanceSubmission = z.infer<typeof volunteerAllowanceSubmissionSchema>;

async function requireOpenSharedAllowance(id: string) {
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  const isEditing = doc?.status === "changes_requested";
  if (!doc?.isSharedLink) throw new Error("Invalid link");
  if (doc.volunteerName && doc.signatureStorageId && !isEditing) {
    throw new Error("Already submitted");
  }
  return doc;
}

export async function getPublicAllowance(id: string) {
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc?.isSharedLink) {
    return {
      valid: false as const,
      error: "Dieser Link ist ungültig.",
    };
  }
  const isEditing = doc.status === "changes_requested";
  if (doc.volunteerName && doc.signatureStorageId && !isEditing) {
    return {
      valid: false as const,
      error: "Dieses Formular wurde bereits eingereicht.",
    };
  }
  const [organization, project] = await Promise.all([
    (await organizations()).findOne({ _id: doc.organizationId }),
    (await projects()).findOne({
      _id: doc.projectId,
      organizationId: doc.organizationId,
    }),
  ]);
  return {
    valid: true as const,
    organizationName: organization?.name || "",
    organizationStreet: organization?.street || "",
    organizationPlz: organization?.plz || "",
    organizationCity: organization?.city || "",
    projectName: project?.name || "",
    activityDescription: doc.activityDescription,
    startDate: doc.startDate,
    endDate: doc.endDate,
    invitedName: doc.invitedName,
    invitedEmail: doc.invitedEmail,
    changesRequested: isEditing ? doc.reviewNote : undefined,
    submission: isEditing
      ? {
          volunteerName: doc.volunteerName,
          submitterEmail: doc.submitterEmail ?? doc.invitedEmail ?? "",
          volunteerStreet: doc.volunteerStreet,
          volunteerPlz: doc.volunteerPlz,
          volunteerCity: doc.volunteerCity,
          amount: doc.amount,
          iban: doc.iban,
          bic: doc.bic ?? "",
          accountHolder: doc.accountHolder,
          taxYear: doc.taxYear ?? "",
          signatureStorageId: doc.signatureStorageId ?? null,
        }
      : undefined,
  };
}

export async function createPublicAllowanceUpload(
  id: string,
  contentType?: string,
) {
  const doc = await requireOpenSharedAllowance(id);
  const upload = await presignUpload(contentType);
  const result = await (
    await volunteerAllowance()
  ).updateOne(
    {
      _id: id,
      isSharedLink: true,
      $or: [
        { signatureStorageId: { $exists: false } },
        { status: "changes_requested" },
      ],
    },
    { $set: { pendingSignatureStorageId: upload.key } },
  );
  if (result.modifiedCount !== 1) throw new Error("Invalid link");
  await registerPendingUpload(upload.key, {
    organizationId: doc.organizationId,
    userId: doc.createdBy,
    contextType: "allowance",
    contextId: id,
  });
  return upload;
}

export async function submitPublicAllowance(
  id: string,
  args: AllowanceSubmission,
): Promise<void> {
  const collection = await volunteerAllowance();
  const existing = await requireOpenSharedAllowance(id);
  const isResubmission = existing.status === "changes_requested";
  const usesExistingSignature =
    args.signatureStorageId === existing.signatureStorageId;
  if (
    !usesExistingSignature &&
    args.signatureStorageId !== existing.pendingSignatureStorageId
  ) {
    throw new Error("Invalid signature");
  }
  if (!usesExistingSignature) {
    await claimPendingUploads(
      [args.signatureStorageId],
      { organizationId: existing.organizationId, userId: existing.createdBy },
      ["allowance"],
      { type: "allowance", id },
      id,
    );
  }

  const result = await collection.updateOne(
    {
      _id: id,
      isSharedLink: true,
      $or: [
        { signatureStorageId: { $exists: false } },
        { status: "changes_requested" },
      ],
    },
    {
      $set: {
        amount: args.amount,
        iban: args.iban,
        bic: args.bic,
        accountHolder: args.accountHolder,
        activityDescription: args.activityDescription,
        startDate: args.startDate,
        endDate: args.endDate,
        taxYear: args.taxYear,
        volunteerName: args.volunteerName,
        submitterEmail: args.submitterEmail,
        volunteerStreet: args.volunteerStreet,
        volunteerPlz: args.volunteerPlz,
        volunteerCity: args.volunteerCity,
        status: "pending",
        signatureStorageId: args.signatureStorageId,
        submittedExternally: true,
      },
      $unset: {
        reviewNote: "",
        rejectionNote: "",
        reviewedBy: "",
        reviewedAt: "",
        pendingSignatureStorageId: "",
      },
    },
  );
  if (result.matchedCount !== 1 || result.modifiedCount !== 1) {
    throw new Error("Already submitted");
  }
  await addLog(
    existing.organizationId,
    existing.createdBy,
    isResubmission
      ? "volunteerAllowance.resubmit"
      : "volunteerAllowance.create",
    id,
    `extern ${args.amount}€`,
  );
  await sendSubmissionReceivedEmail(id);
}
