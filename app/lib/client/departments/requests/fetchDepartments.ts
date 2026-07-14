import type { Department } from "@/lib/db/types";

export async function fetchDepartments(
  archived = false,
): Promise<Department[]> {
  const url = archived ? "/api/departments?archived=true" : "/api/departments";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Departments konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as Department[];
}
