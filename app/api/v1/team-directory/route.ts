import { getTeamDirectoryV1 } from "@/lib/server/teamDirectory/feed";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

export async function GET(request: Request) {
  const organizationId =
    process.env.YFN_TEAM_DIRECTORY_ORGANIZATION_ID?.trim();
  if (!organizationId) {
    return Response.json(
      { error: "Team-Directory ist nicht konfiguriert" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
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
