import {
  getActiveDepartments,
  getArchivedDepartments,
} from "@/lib/server/departments/data";

export async function GET(request: Request) {
  const archived = new URL(request.url).searchParams.get("archived") === "true";
  try {
    const data = archived
      ? await getArchivedDepartments()
      : await getActiveDepartments();
    return Response.json({ data });
  } catch {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
}
