import { z } from "zod";
import { createPublicSignatureUpload } from "@/lib/server/signatures/public";

type RouteContext = { params: Promise<{ token: string }> };
const bodySchema = z.object({ contentType: z.string().optional() });

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  try {
    const { contentType } = bodySchema.parse(await request.json());
    return Response.json(await createPublicSignatureUpload(token, contentType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
