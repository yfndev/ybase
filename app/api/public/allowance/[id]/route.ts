import { getPublicAllowance } from "@/lib/server/volunteerAllowance/public";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return Response.json(await getPublicAllowance(id));
}
