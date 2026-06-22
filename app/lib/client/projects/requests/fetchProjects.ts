import type { Project } from "@/lib/db/types";

export async function fetchProjects(archived = false): Promise<Project[]> {
  const url = archived ? "/api/projects?archived=true" : "/api/projects";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Projekte konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as Project[];
}
