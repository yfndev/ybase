import { z } from "zod";
import { createPublicReimbursementUpload } from "@/lib/server/reimbursements/public";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ contentType: z.string().optional() });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const { contentType } = bodySchema.parse(await request.json());
    return Response.json(
      await createPublicReimbursementUpload(id, contentType),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
