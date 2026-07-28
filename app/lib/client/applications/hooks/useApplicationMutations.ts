import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitApplicationDecision } from "@/lib/server/applications/decisionAction";
import { updateApplicationManagement } from "@/lib/server/applications/management";
import {
  startApplicationOnboarding,
  setApplicationOnboardingCompleted,
} from "@/lib/server/applications/onboarding";
import { setApplicationStatus } from "@/lib/server/applications/status";

export function useApplicationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["applications"] });

  return {
    updateManagement: useMutation({
      mutationFn: updateApplicationManagement,
      onSuccess: invalidate,
    }),
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
      onSuccess: invalidate,
    }),
    startOnboarding: useMutation({
      mutationFn: startApplicationOnboarding,
      onSuccess: invalidate,
    }),
    setOnboardingCompleted: useMutation({
      mutationFn: setApplicationOnboardingCompleted,
      onSuccess: invalidate,
    }),
  };
}
