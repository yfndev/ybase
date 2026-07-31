import { processDailyMemberships } from "@/lib/server/memberships/dailyJob";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const result = await processDailyMemberships();
  return Response.json({ data: result });
}
