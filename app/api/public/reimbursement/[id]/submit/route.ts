import { receipts, reimbursements, travelDetails } from "@/lib/db/collections";
import { newId } from "@/lib/db/ids";
import { addLog } from "@/lib/server/logs";
import { sendSubmissionReceivedEmail } from "@/lib/server/reimbursements/email";
import { bodySchema } from "./submissionSchema";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const args = bodySchema.parse(await request.json());
    const collection = await reimbursements();

    const existing = await collection.findOne({ _id: id });
    if (!existing) throw new Error("Invalid link");
    if (!existing.isSharedLink) throw new Error("Not a shared link");
    const isResubmission = existing.status === "changes_requested";
    if (existing.submitterName && !isResubmission) {
      throw new Error("Already submitted");
    }

    const existingReceipts = await (await receipts())
      .find({ reimbursementId: id })
      .toArray();

    const allowed = new Set([
      ...(existing.pendingUploadKeys ?? []),
      ...existingReceipts.map((receipt) => receipt.fileStorageId),
      ...(existing.signatureStorageId ? [existing.signatureStorageId] : []),
    ]);
    const allReceipts = [...args.receipts, ...(args.travelReceipts ?? [])];
    const usedKeys = [
      args.signatureStorageId,
      ...allReceipts.flatMap((receipt) =>
        receipt.fileStorageId ? [receipt.fileStorageId] : [],
      ),
    ];
    if (usedKeys.some((key) => !allowed.has(key)))
      return Response.json({ error: "Invalid key" }, { status: 400 });

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

    const doc = await collection.findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");

    const receiptsToInsert =
      doc.type === "travel" ? args.travelReceipts || [] : args.receipts;
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

    if (doc.type === "travel" && args.travelDetails) {
      const existingTravel = await (
        await travelDetails()
      ).findOne({
        reimbursementId: id,
      });
      if (existingTravel) {
        await (
          await travelDetails()
        ).updateOne({ _id: existingTravel._id }, { $set: args.travelDetails });
      } else {
        await (
          await travelDetails()
        ).insertOne({
          _id: newId(),
          _creationTime: Date.now(),
          reimbursementId: id,
          ...args.travelDetails,
        });
      }
    }

    await addLog(
      doc.organizationId,
      doc.createdBy,
      isResubmission
        ? "reimbursement.resubmit"
        : "reimbursement.externalSubmit",
      id,
      `extern ${args.amount}€`,
    );
    await sendSubmissionReceivedEmail(id);

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
