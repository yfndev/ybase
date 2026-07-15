import { submitPublicAllowance } from "@/lib/server/volunteerAllowance/public";
import { volunteerAllowanceSubmissionSchema } from "@/lib/volunteerAllowance/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const args = volunteerAllowanceSubmissionSchema.parse(await request.json());
    await submitPublicAllowance(id, args);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
