import { isTestMode } from "@/lib/auth/environment";

type RouteContext = { params: Promise<{ path: string[] }> };

function forbidden(): Response | undefined {
  if (!isTestMode()) return new Response("Forbidden", { status: 403 });
}

export async function GET(_request: Request, context: RouteContext) {
  const denied = forbidden();
  if (denied) return denied;

  const { path } = await context.params;
  if (path[0] !== "forms" || !path[1]) {
    return new Response("Not found", { status: 404 });
  }
  return Response.json({
    id: path[1],
    status: "PUBLISHED",
    workspaceId: "playwright-workspace",
    blocks: [
      {
        uuid: "playwright-email",
        type: "INPUT_EMAIL",
        groupUuid: "playwright-email-group",
        groupType: "INPUT_EMAIL",
      },
    ],
    settings: {},
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const denied = forbidden();
  if (denied) return denied;

  const { path } = await context.params;
  if (path[0] === "forms") {
    return Response.json({ id: crypto.randomUUID(), status: "DRAFT" });
  }
  if (path[0] === "webhooks") {
    return Response.json({ id: crypto.randomUUID() });
  }
  return new Response("Not found", { status: 404 });
}

export async function PATCH() {
  const denied = forbidden();
  if (denied) return denied;
  return new Response(null, { status: 204 });
}
