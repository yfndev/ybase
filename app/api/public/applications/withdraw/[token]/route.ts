import { withdrawApplicationByToken } from "@/lib/server/applications/withdrawal";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  try {
    await withdrawApplicationByToken(token);
    return Response.redirect(
      new URL("/withdraw-application/success", request.url),
      303,
    );
  } catch {
    return Response.redirect(
      new URL("/withdraw-application/invalid", request.url),
      303,
    );
  }
}
