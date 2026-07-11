import { isTestMode } from "@/lib/auth/environment";

export async function PUT() {
  if (!isTestMode()) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(null, { status: 204 });
}
