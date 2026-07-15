import { submitPublicReimbursement } from "@/lib/server/reimbursements/publicSubmission";
import { publicReimbursementSubmissionSchema } from "@/lib/server/reimbursements/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const args = publicReimbursementSubmissionSchema.parse(
      await request.json(),
    );
    await submitPublicReimbursement(id, args);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
