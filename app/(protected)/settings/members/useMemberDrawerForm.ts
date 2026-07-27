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
    updatePublicProfile,
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
  const publicProfile = member.publicTeamProfile;
  const [isPublished, setIsPublished] = useState(
    publicProfile?.isPublished ?? false,
  );
  const [publicDisplayName, setPublicDisplayName] = useState(
    publicProfile?.displayName ?? "",
  );
  const [publicRole, setPublicRole] = useState(publicProfile?.role ?? "");
  const [isTeamLead, setIsTeamLead] = useState(
    publicProfile?.isTeamLead ?? false,
  );
  const [publicSortOrder, setPublicSortOrder] = useState(
    publicProfile?.sortOrder ?? 100,
  );
  const [isBoardMember, setIsBoardMember] = useState(
    Boolean(publicProfile?.board),
  );
  const [boardRole, setBoardRole] = useState(publicProfile?.board?.role ?? "");
  const [boardIsChair, setBoardIsChair] = useState(
    publicProfile?.board?.isChair ?? false,
  );
  const [boardSortOrder, setBoardSortOrder] = useState(
    publicProfile?.board?.sortOrder ?? 100,
  );

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
    updatePublicProfile.isPending ||
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

      const nextPublicProfile = {
        userId: member._id,
        isPublished,
        displayName: publicDisplayName.trim() || undefined,
        role: publicRole.trim() || undefined,
        isTeamLead,
        sortOrder: publicSortOrder,
        board: isBoardMember
          ? {
              role: boardRole.trim(),
              isChair: boardIsChair,
              sortOrder: boardSortOrder,
            }
          : undefined,
      };
      const currentPublicProfile = {
        userId: member._id,
        isPublished: publicProfile?.isPublished ?? false,
        displayName: publicProfile?.displayName,
        role: publicProfile?.role,
        isTeamLead: publicProfile?.isTeamLead ?? false,
        sortOrder: publicProfile?.sortOrder ?? 100,
        board: publicProfile?.board,
      };
      if (
        JSON.stringify(nextPublicProfile) !==
        JSON.stringify(currentPublicProfile)
      ) {
        await updatePublicProfile.mutateAsync(nextPublicProfile);
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
    isPublished,
    setIsPublished,
    publicDisplayName,
    setPublicDisplayName,
    publicRole,
    setPublicRole,
    isTeamLead,
    setIsTeamLead,
    publicSortOrder,
    setPublicSortOrder,
    isBoardMember,
    setIsBoardMember,
    boardRole,
    setBoardRole,
    boardIsChair,
    setBoardIsChair,
    boardSortOrder,
    setBoardSortOrder,
    teamOptions,
    department,
    canEditRoles,
    isSaving,
    handleSave,
  };
}

export type MemberDrawerFormState = ReturnType<typeof useMemberDrawerForm>;
