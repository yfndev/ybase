import { getApplicationsForJobPosting } from "@/lib/server/applications/data";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const data = await getApplicationsForJobPosting(id);
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht gefunden" }, { status: 404 });
  }
}
