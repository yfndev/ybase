import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  setMemberStatus,
  setTeamOnboardingStatus,
} from "@/lib/server/users/lifecycleActions";
import { updateMemberProfile } from "@/lib/server/users/profile";
import { updateUserRole } from "@/lib/server/users/roles";

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
