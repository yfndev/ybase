import { signatureTokens } from "@/lib/db/collections";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  const doc = await (await signatureTokens()).findOne({ token });

  if (!doc) return Response.json(null);

  return Response.json({
    signatureStorageId: doc.signatureStorageId ?? null,
    usedAt: doc.usedAt ?? null,
  });
}
