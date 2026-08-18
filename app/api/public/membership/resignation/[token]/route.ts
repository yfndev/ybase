import { confirmGuardianResignation } from "@/lib/server/memberships/guardianResignation";

type RouteContext = { params: Promise<{ token: string }> };

function redirectTo(pathname: string, requestUrl: string): Response {
  const configuredAppUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL
  )?.trim();
  const baseUrl = configuredAppUrl
    ? `${configuredAppUrl.replace(/\/+$/, "")}/`
    : requestUrl;
  return Response.redirect(new URL(pathname, baseUrl), 303);
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  try {
    await confirmGuardianResignation(token);
    return redirectTo("/membership/resignation/success", request.url);
  } catch {
    const path = `/membership/resignation/${encodeURIComponent(token)}?error=1`;
    return redirectTo(path, request.url);
  }
}
