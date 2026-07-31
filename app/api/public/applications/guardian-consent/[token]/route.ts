import { z } from "zod";
import {
  completeGuardianConsent,
  validateGuardianConsentToken,
} from "@/lib/server/applications/guardianConsentPublic";

type RouteContext = { params: Promise<{ token: string }> };
const bodySchema = z.object({ signatureDataUrl: z.string().max(700_000) });
const noStore = { "Cache-Control": "no-store" };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  return Response.json(await validateGuardianConsentToken(token), {
    headers: noStore,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  try {
    const { signatureDataUrl } = bodySchema.parse(await request.json());
    await completeGuardianConsent(token, signatureDataUrl);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ungültige Anfrage";
    return Response.json({ error: message }, { status: 400, headers: noStore });
  }
}
