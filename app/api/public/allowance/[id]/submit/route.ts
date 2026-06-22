import { z } from "zod";
import { volunteerAllowance } from "@/lib/db/collections";
import { addLog } from "@/lib/server/logs";

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

    const result = await collection.updateOne(
      { _id: id, signatureStorageId: { $exists: false } },
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
          volunteerStreet: args.volunteerStreet,
          volunteerPlz: args.volunteerPlz,
          volunteerCity: args.volunteerCity,
          signatureStorageId: args.signatureStorageId,
        },
      },
    );

    if (result.matchedCount !== 1) throw new Error("Already submitted");

    const doc = await collection.findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");

    await addLog(
      doc.organizationId,
      doc.createdBy,
      "volunteerAllowance.create",
      id,
      `extern ${args.amount}€`,
    );

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
