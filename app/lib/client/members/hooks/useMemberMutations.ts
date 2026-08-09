import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmGettingToKnow,
  endGettingToKnow,
} from "@/lib/server/memberships/gettingToKnow";
import { recordMembershipResignation } from "@/lib/server/memberships/resignation";
import { createMember } from "@/lib/server/users/creation";
import {
  setMemberStatus,
  setTeamOnboardingStatus,
} from "@/lib/server/users/lifecycleActions";
import { recordMemberInfraction } from "@/lib/server/users/infractions";
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
    recordInfraction: useMutation({
      mutationFn: recordMemberInfraction,
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
    updateRole: useMutation({ mutationFn: updateUserRole, onSuccess }),
  };
}
