import { z } from "zod";
import { getPublicReimbursementFileUrl } from "@/lib/server/reimbursements/public";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ key: z.string() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const { key } = bodySchema.parse(await request.json());
    const url = await getPublicReimbursementFileUrl(id, key);
    return Response.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
