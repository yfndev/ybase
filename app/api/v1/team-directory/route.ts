import { authenticateTeamDirectoryToken } from "@/lib/server/teamDirectory/auth";
import { getTeamDirectoryV1 } from "@/lib/server/teamDirectory/feed";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
  Vary: "Authorization",
};

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  return match?.[1] ?? null;
}

export async function GET(request: Request) {
  const token = bearerToken(request);
  const organizationId = token ? authenticateTeamDirectoryToken(token) : null;
  if (!organizationId) {
    return Response.json(
      { error: "Nicht autorisiert" },
      { status: 401, headers: RESPONSE_HEADERS },
    );
  }

  const feed = await getTeamDirectoryV1(organizationId);
  const etag = `"${feed.revision}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ...RESPONSE_HEADERS, ETag: etag },
    });
  }
  return Response.json(feed, {
    headers: { ...RESPONSE_HEADERS, ETag: etag },
  });
}
