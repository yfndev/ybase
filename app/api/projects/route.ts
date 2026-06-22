import {
  getAllProjects,
  getArchivedProjects,
} from "@/lib/server/projects/data";

export async function GET(request: Request) {
  const archived = new URL(request.url).searchParams.get("archived") === "true";
  try {
    const data = archived
      ? await getArchivedProjects()
      : await getAllProjects();
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
