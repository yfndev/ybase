import { processDailyMemberships } from "@/lib/server/memberships/dailyJob";
import { processGettingToKnowPhases } from "@/lib/server/memberships/gettingToKnowJob";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const memberships = await processDailyMemberships();
  const gettingToKnow = await processGettingToKnowPhases();
  return Response.json({ data: { ...memberships, ...gettingToKnow } });
}
