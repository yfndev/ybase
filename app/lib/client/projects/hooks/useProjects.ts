import type { Project } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchProjects } from "../requests/fetchProjects";

export function useProjects(archived = false) {
  const result = useQuery<Project[]>({
    queryKey: ["projects", archived ? "archived" : "active"],
    queryFn: () => fetchProjects(archived),
  });

  return { projects: result.data ?? [], isLoading: result.isLoading };
}
