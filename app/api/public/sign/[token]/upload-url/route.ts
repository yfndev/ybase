import { z } from "zod";
import { signatureTokens } from "@/lib/db/collections";
import { presignUpload } from "@/lib/s3/storage";

type RouteContext = { params: Promise<{ token: string }> };

const bodySchema = z.object({ contentType: z.string().optional() });

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const { contentType } = bodySchema.parse(await request.json());

    const doc = await (await signatureTokens()).findOne({ token });
    if (!doc) throw new Error("Ungültiger Link");
    if (doc.expiresAt < Date.now()) throw new Error("Link abgelaufen");
    if (doc.usedAt) throw new Error("Link bereits verwendet");

    const { key, url } = await presignUpload(contentType);

    await (
      await signatureTokens()
    ).updateOne(
      { token, usedAt: { $exists: false }, expiresAt: { $gt: Date.now() } },
      { $set: { pendingSignatureStorageId: key } },
    );

    return Response.json({ key, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
