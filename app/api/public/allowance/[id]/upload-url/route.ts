import { z } from "zod";
import { volunteerAllowance } from "@/lib/db/collections";
import { presignUpload } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({ contentType: z.string().optional() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { contentType } = bodySchema.parse(await request.json());

    const doc = await (await volunteerAllowance()).findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");
    if (doc.volunteerName && doc.signatureStorageId)
      throw new Error("Already submitted");

    const { key, url } = await presignUpload(contentType);

    await (
      await volunteerAllowance()
    ).updateOne(
      { _id: id, signatureStorageId: { $exists: false } },
      { $set: { pendingSignatureStorageId: key } },
    );

    return Response.json({ key, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
