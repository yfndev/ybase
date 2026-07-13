import { z } from "zod";
import { receipts, reimbursements } from "@/lib/db/collections";
import { presignDownload } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({ key: z.string() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { key } = bodySchema.parse(await request.json());

    const doc = await (await reimbursements()).findOne({ _id: id });
    if (
      !doc ||
      !doc.isSharedLink ||
      (doc.amount !== 0 && doc.status !== "changes_requested")
    ) {
      throw new Error("Invalid link");
    }

    const existingReceipt = await (
      await receipts()
    ).findOne({ reimbursementId: id, fileStorageId: key });
    const allowed =
      (doc.pendingUploadKeys ?? []).includes(key) ||
      Boolean(existingReceipt) ||
      doc.signatureStorageId === key;
    if (!allowed) throw new Error("Invalid key");

    const url = await presignDownload(key);
    return Response.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
