import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmGettingToKnow,
  endGettingToKnow,
} from "@/lib/server/memberships/gettingToKnow";
import { recordMembershipResignation } from "@/lib/server/memberships/resignation";
import { deleteMemberWorkspaceAccount } from "@/lib/server/users/accountDeletion";
import { createMember } from "@/lib/server/users/creation";
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
    create: useMutation({ mutationFn: createMember, onSuccess }),
    updateProfile: useMutation({ mutationFn: updateMemberProfile, onSuccess }),
    setStatus: useMutation({ mutationFn: setMemberStatus, onSuccess }),
    setOnboarding: useMutation({
      mutationFn: setTeamOnboardingStatus,
      onSuccess,
    }),
    recordResignation: useMutation({
      mutationFn: recordMembershipResignation,
      onSuccess,
    }),
    confirmGettingToKnow: useMutation({
      mutationFn: confirmGettingToKnow,
      onSuccess,
    }),
    endGettingToKnow: useMutation({ mutationFn: endGettingToKnow, onSuccess }),
    deleteWorkspaceAccount: useMutation({
      mutationFn: deleteMemberWorkspaceAccount,
      onSuccess,
    }),
    updateRole: useMutation({ mutationFn: updateUserRole, onSuccess }),
  };
}
