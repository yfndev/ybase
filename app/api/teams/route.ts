import { createTeam } from "@/lib/server/teams/actions";
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

export async function POST(request: Request) {
  try {
    const data = await createTeam(await request.json());
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Team could not be created", error);
    return Response.json(
      { error: "Team konnte nicht erstellt werden" },
      { status: 400 },
    );
  }
}
