import { signatureTokens } from "@/lib/db/collections";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  const doc = await (await signatureTokens()).findOne({ token });

  if (!doc) return Response.json({ valid: false, error: "Ungültiger Link" });
  if (doc.expiresAt < Date.now())
    return Response.json({ valid: false, error: "Link abgelaufen" });
  if (doc.usedAt)
    return Response.json({ valid: false, error: "Link bereits verwendet" });

  return Response.json({ valid: true });
}
