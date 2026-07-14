import { getActiveTeams, getArchivedTeams } from "@/lib/server/teams/data";

export async function GET(request: Request) {
  const archived = new URL(request.url).searchParams.get("archived") === "true";
  try {
    const data = archived ? await getArchivedTeams() : await getActiveTeams();
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
