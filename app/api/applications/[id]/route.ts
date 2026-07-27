import { getApplication } from "@/lib/server/applications/management";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    return Response.json({ data: await getApplication(id) });
  } catch {
    return Response.json({ error: "Nicht gefunden" }, { status: 404 });
  }
}
