import type { z } from "zod";
import { receipts, reimbursements, travelDetails } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";
import { claimPendingUploads } from "../uploads/ownership";
import { sendSubmissionReceivedEmail } from "./email";
import { requireOpenSharedReimbursement } from "./public";
import type { publicReimbursementSubmissionSchema } from "./schemas";

type PublicSubmission = z.infer<typeof publicReimbursementSubmissionSchema>;

export async function submitPublicReimbursement(
  id: string,
  args: PublicSubmission,
): Promise<void> {
  const collection = await reimbursements();
  const existing = await requireOpenSharedReimbursement(id);
  const isResubmission = existing.status === "changes_requested";
  if (existing.submitterName && !isResubmission) {
    throw new Error("Already submitted");
  }

  const existingReceipts = await (await receipts())
    .find({ reimbursementId: id })
    .toArray();
  const attachedKeys = new Set([
    ...existingReceipts.map((receipt) => receipt.fileStorageId),
    ...(existing.signatureStorageId ? [existing.signatureStorageId] : []),
  ]);
  const pendingKeys = new Set(existing.pendingUploadKeys ?? []);
  const allReceipts = [...args.receipts, ...(args.travelReceipts ?? [])];
  const usedKeys = [
    args.signatureStorageId,
    ...allReceipts.flatMap((receipt) =>
      receipt.fileStorageId ? [receipt.fileStorageId] : [],
    ),
  ];
  if (usedKeys.some((key) => !attachedKeys.has(key) && !pendingKeys.has(key))) {
    throw new Error("Invalid key");
  }
  const newKeys = usedKeys.filter((key) => !attachedKeys.has(key));
  await claimPendingUploads(
    newKeys,
    { organizationId: existing.organizationId, userId: existing.createdBy },
    ["reimbursement"],
    { type: "reimbursement", id },
    id,
  );

  const result = await collection.updateOne(
    {
      _id: id,
      isSharedLink: true,
      $or: [
        { submitterName: { $exists: false } },
        { status: "changes_requested" },
      ],
    },
    {
      $set: {
        amount: args.amount,
        iban: args.iban,
        bic: args.bic,
        accountHolder: args.accountHolder,
        submitterName: args.submitterName,
        submitterEmail: args.submitterEmail,
        signatureStorageId: args.signatureStorageId,
        status: "pending",
        submittedExternally: true,
        submittedAt: Date.now(),
      },
      $unset: {
        reviewNote: "",
        rejectionNote: "",
        reviewedBy: "",
        reviewedAt: "",
        pendingUploadKeys: "",
      },
    },
  );
  if (result.matchedCount !== 1) throw new Error("Already submitted");

  const receiptsToInsert =
    existing.type === "travel" ? args.travelReceipts || [] : args.receipts;
  if (isResubmission) {
    await (await receipts()).deleteMany({ reimbursementId: id });
  }
  for (const receipt of receiptsToInsert) {
    await (
      await receipts()
    ).insertOne({
      _id: newId(),
      _creationTime: Date.now(),
      reimbursementId: id,
      ...receipt,
      fileStorageId: receipt.fileStorageId ?? "",
    });
  }
  if (existing.type === "travel" && args.travelDetails) {
    await (
      await travelDetails()
    ).updateOne(
      { reimbursementId: id },
      {
        $set: args.travelDetails,
        $setOnInsert: { _id: newId(), _creationTime: Date.now() },
      },
      { upsert: true },
    );
  }
  await addLog(
    existing.organizationId,
    existing.createdBy,
    isResubmission ? "reimbursement.resubmit" : "reimbursement.externalSubmit",
    id,
    `extern ${args.amount}€`,
  );
  await sendSubmissionReceivedEmail(id);
}
