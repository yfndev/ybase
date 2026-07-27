import { useQuery } from "@tanstack/react-query";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { fetchApplication } from "../requests/fetchApplication";

export function useApplication(
  applicationId: string,
  initialData: ApplicationWithFiles,
) {
  const result = useQuery<ApplicationWithFiles>({
    queryKey: ["applications", "detail", applicationId],
    queryFn: () => fetchApplication(applicationId),
    initialData,
    refetchInterval: (query) =>
      query.state.data?.files.some((file) =>
        ["pending", "importing"].includes(file.status),
      )
        ? 1_500
        : false,
  });

  return {
    application: result.data,
    refetch: result.refetch,
  };
}
