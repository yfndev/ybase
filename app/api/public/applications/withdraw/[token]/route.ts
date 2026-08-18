import { withdrawApplicationByToken } from "@/lib/server/applications/withdrawal";

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
    await withdrawApplicationByToken(token);
    return redirectTo("/withdraw-application/success", request.url);
  } catch {
    return redirectTo("/withdraw-application/invalid", request.url);
  }
}
