import { getApplications } from "@/lib/server/applications/management";

export async function GET() {
  try {
    return Response.json({ data: await getApplications() });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
