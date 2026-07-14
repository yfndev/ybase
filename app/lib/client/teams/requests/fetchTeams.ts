import type { Team } from "@/lib/db/types";

export async function fetchTeams(archived = false): Promise<Team[]> {
  const url = archived ? "/api/teams?archived=true" : "/api/teams";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Teams konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as Team[];
}
