import { z } from "zod";
import { signatureTokens } from "@/lib/db/collections";

type RouteContext = { params: Promise<{ token: string }> };

const bodySchema = z.object({ signatureStorageId: z.string() });

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const { signatureStorageId } = bodySchema.parse(await request.json());

    const result = await (
      await signatureTokens()
    ).updateOne(
      { token, usedAt: { $exists: false }, expiresAt: { $gt: Date.now() } },
      { $set: { signatureStorageId, usedAt: Date.now() } },
    );

    if (result.modifiedCount !== 1) throw new Error("Link bereits verwendet");

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
