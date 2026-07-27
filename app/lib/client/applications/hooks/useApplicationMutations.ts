import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendApplicationDecision } from "@/lib/server/applications/decision";
import { updateApplicationManagement } from "@/lib/server/applications/management";
import {
  setApplicationOnboardingCompleted,
  setApplicationYfnEmail,
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
      mutationFn: sendApplicationDecision,
      onSuccess: invalidate,
    }),
    setYfnEmail: useMutation({
      mutationFn: setApplicationYfnEmail,
      onSuccess: invalidate,
    }),
    setOnboardingCompleted: useMutation({
      mutationFn: setApplicationOnboardingCompleted,
      onSuccess: invalidate,
    }),
  };
}
