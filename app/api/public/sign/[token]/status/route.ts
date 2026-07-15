import { getPublicSignStatus } from "@/lib/server/signatures/public";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  return Response.json(await getPublicSignStatus(token));
}
