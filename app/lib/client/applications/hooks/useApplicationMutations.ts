import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestGuardianConsent } from "@/lib/server/applications/admissionRequirements";
import { selectApplicationMemberPlatformProfileAction } from "@/lib/server/applications/admissionRequirementsAction";
import { submitApplicationDecision } from "@/lib/server/applications/decisionAction";
import { setApplicationStatus } from "@/lib/server/applications/status";

export function useApplicationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["applications"] });

  return {
    setStatus: useMutation({
      mutationFn: setApplicationStatus,
      onSuccess: invalidate,
    }),
    sendDecision: useMutation({
      mutationFn: async (
        input: Parameters<typeof submitApplicationDecision>[0],
      ) => {
        const result = await submitApplicationDecision(input);
        if (!result.ok) throw new Error(result.error);
      },
      onSuccess: (_, input) => {
        invalidate();
        if (input.decision === "accepted") {
          queryClient.invalidateQueries({ queryKey: ["members"] });
        }
      },
    }),
    selectMemberPlatformProfile: useMutation({
      mutationFn: async (
        input: Parameters<
          typeof selectApplicationMemberPlatformProfileAction
        >[0],
      ) => {
        const result =
          await selectApplicationMemberPlatformProfileAction(input);
        if (!result.ok)
          throw new Error("Member-Profil konnte nicht zugeordnet werden.");
      },
      onSuccess: invalidate,
    }),
    requestGuardianConsent: useMutation({
      mutationFn: requestGuardianConsent,
      onSuccess: invalidate,
    }),
  };
}
