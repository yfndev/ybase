import type { TallyTemplateOption } from "@/lib/tally/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTallyTemplates } from "../requests/fetchTallyTemplates";

export function useTallyTemplates(enabled: boolean) {
  const result = useQuery<TallyTemplateOption[]>({
    queryKey: ["tallyTemplates"],
    queryFn: fetchTallyTemplates,
    enabled,
    staleTime: 60_000,
  });

  return {
    templates: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
