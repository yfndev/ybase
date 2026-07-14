import {
  setMemberStatus,
  setTeamOnboardingStatus,
  updateMemberProfile,
  updateUserRole,
} from "@/lib/server/users/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["members"] });

  return {
    updateProfile: useMutation({ mutationFn: updateMemberProfile, onSuccess }),
    setStatus: useMutation({ mutationFn: setMemberStatus, onSuccess }),
    setOnboarding: useMutation({
      mutationFn: setTeamOnboardingStatus,
      onSuccess,
    }),
    updateRole: useMutation({ mutationFn: updateUserRole, onSuccess }),
  };
}
