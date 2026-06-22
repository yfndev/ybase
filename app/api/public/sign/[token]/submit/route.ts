import { signatureTokens } from "@/lib/db/collections";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const now = Date.now();

    const result = await (
      await signatureTokens()
    ).updateOne(
      {
        token,
        usedAt: { $exists: false },
        expiresAt: { $gt: now },
        pendingSignatureStorageId: { $exists: true },
      },
      [
        {
          $set: {
            signatureStorageId: "$pendingSignatureStorageId",
            usedAt: now,
          },
        },
      ],
    );

    if (result.modifiedCount !== 1) throw new Error("Link bereits verwendet");

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
