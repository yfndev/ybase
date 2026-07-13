import { z } from "zod";
import { volunteerAllowance } from "@/lib/db/collections";
import { addLog } from "@/lib/server/logs";
import { sendSubmissionReceivedEmail } from "@/lib/server/volunteerAllowance/email";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_VOLUNTEER_ALLOWANCE_EUR = 960;

const bodySchema = z.object({
  amount: z.number(),
  iban: z.string(),
  bic: z.string().optional(),
  accountHolder: z.string(),
  activityDescription: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  taxYear: z.string().optional(),
  volunteerName: z.string(),
  submitterEmail: z.string().email(),
  volunteerStreet: z.string(),
  volunteerPlz: z.string(),
  volunteerCity: z.string(),
  signatureStorageId: z.string(),
});

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const args = bodySchema.parse(await request.json());

    if (args.amount > MAX_VOLUNTEER_ALLOWANCE_EUR)
      throw new Error(`Amount cannot exceed ${MAX_VOLUNTEER_ALLOWANCE_EUR}€`);

    const collection = await volunteerAllowance();
    const existing = await collection.findOne({ _id: id });
    if (!existing?.isSharedLink) throw new Error("Invalid link");
    const isResubmission = existing.status === "changes_requested";
    if (existing.signatureStorageId && !isResubmission) {
      throw new Error("Already submitted");
    }
    const signatureAllowed =
      args.signatureStorageId === existing.pendingSignatureStorageId ||
      args.signatureStorageId === existing.signatureStorageId;
    if (!signatureAllowed) throw new Error("Invalid signature");

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

    if (result.matchedCount !== 1 || result.modifiedCount !== 1)
      throw new Error("Already submitted");

    const doc = await collection.findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");

    await addLog(
      doc.organizationId,
      doc.createdBy,
      isResubmission
        ? "volunteerAllowance.resubmit"
        : "volunteerAllowance.create",
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
