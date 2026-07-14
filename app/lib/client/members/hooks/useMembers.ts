import type { User } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchMembers } from "../requests/fetchMembers";

export function useMembers() {
  const result = useQuery<User[]>({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  return { members: result.data ?? [], isLoading: result.isLoading };
}
