import { after } from "next/server";
import { importApplicationFile } from "@/lib/server/applications/fileImport";
import { queueApplicationFileRetry } from "@/lib/server/applications/files";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const applicationId = await queueApplicationFileRetry(id);
    after(() => importApplicationFile(applicationId, id));
    return Response.json({ ok: true }, { status: 202 });
  } catch {
    return Response.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }
}
