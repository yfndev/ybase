import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { MemberStatus, UserRole } from "@/lib/db/types";
import { useState } from "react";
import toast from "react-hot-toast";
import type { MemberDrawerProps } from "./MemberDrawer.types";

const LAST_ADMIN_MESSAGE =
  "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.";

export function useMemberDrawerForm(
  {
    member,
    teams,
    departments,
    canEditRoles,
    adminCount,
    onClose,
  }: MemberDrawerProps,
  onSavingChange: (isSaving: boolean) => void,
) {
  const {
    updateProfile,
    setStatus: setStatusMutation,
    updateRole,
  } = useMemberMutations();
  const [teamId, setTeamId] = useState(member.teamId ?? "");
  const [secondaryTeamId, setSecondaryTeamId] = useState(
    member.secondaryTeamId ?? "",
  );
  const [position, setPosition] = useState(member.positionTitle ?? "");
  const [status, setStatus] = useState<MemberStatus>(member.memberStatus);
  const [role, setRole] = useState<UserRole>(member.role ?? "member");
  const [isTeamLead, setIsTeamLead] = useState(member.isTeamLead ?? false);
  const [isSecondaryTeamLead, setIsSecondaryTeamLead] = useState(
    member.isSecondaryTeamLead ?? false,
  );
  const [isBoardMember, setIsBoardMember] = useState(
    member.boardMembership !== undefined,
  );
  const [boardDepartmentId, setBoardDepartmentId] = useState(
    member.boardMembership?.departmentId ?? "",
  );
  const [boardIsChair, setBoardIsChair] = useState(
    member.boardMembership?.isChair ?? false,
  );

  const activeTeams = teams.filter((team) => !team.isArchived);
  const activeDepartments = departments.filter(
    (department) => !department.isArchived,
  );
  const teamOptions = activeTeams.map((team) => ({
    value: team._id,
    label: team.name,
  }));
  const departmentOptions = activeDepartments.map((department) => ({
    value: department._id,
    label: department.name,
  }));
  const selectedTeam = activeTeams.find((team) => team._id === teamId);
  const department = selectedTeam
    ? departments.find((entry) => entry._id === selectedTeam.departmentId)
    : undefined;
  const isSaving =
    updateProfile.isPending ||
    setStatusMutation.isPending ||
    updateRole.isPending;

  const handleSave = async () => {
    onSavingChange(true);

    try {
      if (isBoardMember && !boardDepartmentId) {
        toast.error("Bitte wähle ein Department aus.");
        return;
      }
      if (!isBoardMember && status === "active" && !teamId) {
        toast.error("Bitte wähle ein Team aus.");
        return;
      }
      if (teamId && secondaryTeamId === teamId) {
        toast.error("Hauptteam und weiteres Team müssen unterschiedlich sein.");
        return;
      }

      const profile: {
        userId: string;
        teamId?: string | null;
        secondaryTeamId?: string | null;
        positionTitle?: string | null;
        isTeamLead?: boolean;
        isSecondaryTeamLead?: boolean;
        boardMembership?: {
          departmentId: string;
          isChair: boolean;
        } | null;
      } = { userId: member._id };
      if (isBoardMember) {
        if (member.teamId) profile.teamId = null;
        if (member.secondaryTeamId) profile.secondaryTeamId = null;
      } else if (teamId && teamId !== member.teamId) {
        profile.teamId = teamId;
      }
      if (
        !isBoardMember &&
        secondaryTeamId !== (member.secondaryTeamId ?? "")
      ) {
        profile.secondaryTeamId = secondaryTeamId || null;
      }
      const trimmed = position.trim();
      const currentPosition = member.positionTitle?.trim() ?? "";
      if (trimmed !== currentPosition) {
        profile.positionTitle = trimmed || null;
      }
      const nextIsTeamLead = isBoardMember ? false : isTeamLead;
      if (nextIsTeamLead !== (member.isTeamLead ?? false)) {
        profile.isTeamLead = nextIsTeamLead;
      }
      const nextIsSecondaryTeamLead =
        isBoardMember || !secondaryTeamId ? false : isSecondaryTeamLead;
      if (nextIsSecondaryTeamLead !== (member.isSecondaryTeamLead ?? false)) {
        profile.isSecondaryTeamLead = nextIsSecondaryTeamLead;
      }
      const nextBoardMembership = isBoardMember
        ? { departmentId: boardDepartmentId, isChair: boardIsChair }
        : null;
      const currentBoardMembership = member.boardMembership ?? null;
      if (
        JSON.stringify(nextBoardMembership) !==
        JSON.stringify(currentBoardMembership)
      ) {
        profile.boardMembership = nextBoardMembership;
      }
      if (
        profile.teamId !== undefined ||
        profile.secondaryTeamId !== undefined ||
        profile.positionTitle !== undefined ||
        profile.isTeamLead !== undefined ||
        profile.isSecondaryTeamLead !== undefined ||
        profile.boardMembership !== undefined
      ) {
        await updateProfile.mutateAsync(profile);
      }

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
    } finally {
      onSavingChange(false);
    }
  };

  return {
    teamId,
    setTeamId,
    secondaryTeamId,
    setSecondaryTeamId,
    position,
    setPosition,
    status,
    setStatus,
    role,
    setRole,
    isTeamLead,
    setIsTeamLead,
    isSecondaryTeamLead,
    setIsSecondaryTeamLead,
    isBoardMember,
    setIsBoardMember,
    boardDepartmentId,
    setBoardDepartmentId,
    boardIsChair,
    setBoardIsChair,
    teamOptions,
    departmentOptions,
    department,
    canEditRoles,
    isSaving,
    handleSave,
  };
}

export type MemberDrawerFormState = ReturnType<typeof useMemberDrawerForm>;
