import { z } from "zod";
import { reimbursements } from "@/lib/db/collections";
import { presignUpload } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({ contentType: z.string().optional() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { contentType } = bodySchema.parse(await request.json());

    const doc = await (await reimbursements()).findOne({ _id: id });
    if (!doc) throw new Error("Invalid link");
    if (!doc.isSharedLink) throw new Error("Not a shared link");
    if (doc.submitterName && doc.status !== "changes_requested") {
      throw new Error("Already submitted");
    }

    const { key, url } = await presignUpload(contentType);

    await (
      await reimbursements()
    ).updateOne(
      {
        _id: id,
        isSharedLink: true,
        $or: [
          { submitterName: { $exists: false } },
          { status: "changes_requested" },
        ],
      },
      { $addToSet: { pendingUploadKeys: key } },
    );

    return Response.json({ key, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
