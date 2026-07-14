import { listMembers } from "@/lib/server/users/data";

export async function GET() {
  try {
    const data = await listMembers();
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
