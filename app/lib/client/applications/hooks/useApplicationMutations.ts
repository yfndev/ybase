import { updateApplicationManagement } from "@/lib/server/applications/management";
import { sendApplicationDecision } from "@/lib/server/applications/decision";
import { setApplicationStatus } from "@/lib/server/applications/status";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  };
}
