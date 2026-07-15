import { getJobFeedV1 } from "../../../lib/server/jobFeed/feed";
import { authenticateJobFeedToken } from "../../../lib/server/jobFeed/token";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Authorization",
};

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  return match?.[1] ?? null;
}

export async function GET(request: Request) {
  const token = bearerToken(request);
  const organizationId = token ? await authenticateJobFeedToken(token) : null;
  if (!organizationId) {
    return Response.json(
      { error: "Nicht autorisiert" },
      { status: 401, headers: RESPONSE_HEADERS },
    );
  }

  const data = await getJobFeedV1(organizationId);
  return Response.json(
    { version: "v1", data },
    {
      headers: RESPONSE_HEADERS,
    },
  );
}
