import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type {
  MemberStatus,
  TeamOnboardingStatus,
  UserRole,
} from "@/lib/db/types";
import { useState } from "react";
import toast from "react-hot-toast";
import type { MemberDrawerProps } from "./MemberDrawer.types";

const LAST_ADMIN_MESSAGE =
  "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.";

export function useMemberDrawerForm({
  member,
  teams,
  departments,
  canEditRoles,
  adminCount,
  onClose,
}: MemberDrawerProps) {
  const {
    updateProfile,
    setStatus: setStatusMutation,
    setOnboarding: setOnboardingMutation,
    updateRole,
  } = useMemberMutations();
  const [teamId, setTeamId] = useState(member.teamId ?? "");
  const [position, setPosition] = useState(member.positionTitle ?? "");
  const [status, setStatus] = useState<MemberStatus>(member.memberStatus);
  const [onboarding, setOnboarding] = useState<TeamOnboardingStatus>(
    member.teamOnboardingStatus,
  );
  const [role, setRole] = useState<UserRole>(member.role ?? "member");

  const activeTeams = teams.filter((team) => !team.isArchived);
  const teamOptions = activeTeams.map((team) => ({
    value: team._id,
    label: team.name,
  }));
  const selectedTeam = activeTeams.find((team) => team._id === teamId);
  const department = selectedTeam
    ? departments.find((entry) => entry._id === selectedTeam.departmentId)
    : undefined;
  const isSaving =
    updateProfile.isPending ||
    setStatusMutation.isPending ||
    setOnboardingMutation.isPending ||
    updateRole.isPending;

  const handleSave = async () => {
    try {
      const profile: {
        userId: string;
        teamId?: string;
        positionTitle?: string;
      } = { userId: member._id };
      if (teamId && teamId !== member.teamId) profile.teamId = teamId;
      const trimmed = position.trim();
      if (trimmed && trimmed !== member.positionTitle)
        profile.positionTitle = trimmed;
      if (profile.teamId || profile.positionTitle)
        await updateProfile.mutateAsync(profile);

      if (onboarding !== member.teamOnboardingStatus)
        await setOnboardingMutation.mutateAsync({
          userId: member._id,
          status: onboarding,
        });
      if (status !== member.memberStatus)
        await setStatusMutation.mutateAsync({ userId: member._id, status });

      if (canEditRoles && role !== (member.role ?? "member")) {
        const demotesLastAdmin =
          member.role === "admin" && role !== "admin" && adminCount <= 1;
        if (demotesLastAdmin) {
          toast.error(LAST_ADMIN_MESSAGE);
          return;
        }
        await updateRole.mutateAsync({ userId: member._id, role });
      }

      toast.success("Teammitglied aktualisiert");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    }
  };

  return {
    teamId,
    setTeamId,
    position,
    setPosition,
    status,
    setStatus,
    onboarding,
    setOnboarding,
    role,
    setRole,
    teamOptions,
    department,
    canEditRoles,
    isSaving,
    handleSave,
  };
}

export type MemberDrawerFormState = ReturnType<typeof useMemberDrawerForm>;
