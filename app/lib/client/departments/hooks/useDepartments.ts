import type { Department } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchDepartments } from "../requests/fetchDepartments";

export function useDepartments(archived = false) {
  const result = useQuery<Department[]>({
    queryKey: ["departments", archived ? "archived" : "active"],
    queryFn: () => fetchDepartments(archived),
  });

  return { departments: result.data ?? [], isLoading: result.isLoading };
}
