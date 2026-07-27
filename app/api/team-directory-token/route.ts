import { rotateTeamDirectoryToken } from "@/lib/server/teamDirectory/token";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await rotateTeamDirectoryToken();
    return Response.json(
      { data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Nicht autorisiert" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
}
