import { z } from "zod";
import { reimbursements } from "@/lib/db/collections";
import { presignDownload } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({ key: z.string() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { key } = bodySchema.parse(await request.json());

    const doc = await (await reimbursements()).findOne({ _id: id });
    if (!doc || !doc.isSharedLink || doc.amount !== 0) {
      throw new Error("Invalid link");
    }

    if (!(doc.pendingUploadKeys ?? []).includes(key))
      throw new Error("Invalid key");

    const url = await presignDownload(key);
    return Response.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
