import { rotateJobFeedToken } from "../../lib/server/jobFeed/token";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await rotateJobFeedToken();
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
