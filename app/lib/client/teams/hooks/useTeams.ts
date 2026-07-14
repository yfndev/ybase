import type { Team } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchTeams } from "../requests/fetchTeams";

export function useTeams(archived = false) {
  const result = useQuery<Team[]>({
    queryKey: ["teams", archived ? "archived" : "active"],
    queryFn: () => fetchTeams(archived),
  });

  return { teams: result.data ?? [], isLoading: result.isLoading };
}
