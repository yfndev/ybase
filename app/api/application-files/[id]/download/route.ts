import { getApplicationFileDownloadUrl } from "@/lib/server/applications/files";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const url = await getApplicationFileDownloadUrl(id);
    return Response.redirect(url, 303);
  } catch {
    return Response.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }
}
