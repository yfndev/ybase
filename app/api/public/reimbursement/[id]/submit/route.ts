import { z } from "zod";
import { receipts, reimbursements, travelDetails } from "@/lib/db/collections";
import { newId } from "@/lib/db/ids";
import { addLog } from "@/lib/server/logs";

type RouteContext = { params: Promise<{ id: string }> };

const baseReceiptFields = {
  receiptNumber: z.string().optional(),
  receiptDate: z.string(),
  companyName: z.string(),
  description: z.string(),
  netAmount: z.number(),
  taxRate: z.number(),
  grossAmount: z.number(),
  fileStorageId: z.string(),
};

const receiptSchema = z.object(baseReceiptFields);

const travelReceiptSchema = z.object({
  ...baseReceiptFields,
  costType: z.enum(["car", "train", "flight", "taxi", "bus", "accommodation"]),
  kilometers: z.number().optional(),
});

const bodySchema = z.object({
  amount: z.number(),
  iban: z.string(),
  bic: z.string(),
  accountHolder: z.string(),
  submitterName: z.string(),
  submitterEmail: z.string().optional(),
  signatureStorageId: z.string(),
  receipts: z.array(receiptSchema),
  travelReceipts: z.array(travelReceiptSchema).optional(),
  travelDetails: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
      destination: z.string(),
      purpose: z.string(),
      isInternational: z.boolean(),
      mealAllowanceDays: z.number().optional(),
      mealAllowanceDailyBudget: z.number().optional(),
    })
    .optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const args = bodySchema.parse(await request.json());
    const collection = await reimbursements();

    const result = await collection.updateOne(
      { _id: id, isSharedLink: true, submitterName: { $exists: false } },
      {
        $set: {
          amount: args.amount,
          iban: args.iban,
          bic: args.bic,
          accountHolder: args.accountHolder,
          submitterName: args.submitterName,
          submitterEmail: args.submitterEmail,
          signatureStorageId: args.signatureStorageId,
        },
      },
    );

    if (result.matchedCount !== 1) throw new Error("Already submitted");

    const doc = await collection.findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");

    const receiptsToInsert =
      doc.type === "travel" ? args.travelReceipts || [] : args.receipts;
    for (const receipt of receiptsToInsert) {
      await (
        await receipts()
      ).insertOne({
        _id: newId(),
        _creationTime: Date.now(),
        reimbursementId: id,
        ...receipt,
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
      "reimbursement.externalSubmit",
      id,
      `extern ${args.amount}€`,
    );

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
