import { useQuery } from "@tanstack/react-query";
import { searchApplicationMemberPlatformProfilesAction } from "@/lib/server/applications/admissionRequirementsAction";
import type { ApplicationMemberPlatformCandidate } from "@/lib/server/applications/memberPlatformCandidates";

export function useApplicationMemberPlatformProfiles(
  applicationId: string,
  enabled: boolean,
) {
  const result = useQuery<ApplicationMemberPlatformCandidate[]>({
    queryKey: ["application-member-platform-profiles", applicationId],
    queryFn: async () => {
      const response = await searchApplicationMemberPlatformProfilesAction({
        applicationId,
      });
      if (!response.ok) {
        throw new Error("Member-Profile konnten nicht geladen werden.");
      }
      return response.candidates;
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });

  return {
    candidates: result.data ?? null,
    isError: result.isError,
    isSearching: result.isFetching,
    refetch: result.refetch,
  };
}
