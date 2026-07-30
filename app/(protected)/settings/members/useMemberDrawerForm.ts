import { useState } from "react";
import toast from "react-hot-toast";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { BoardMembership, MemberStatus, UserRole } from "@/lib/db/types";
import { normalizeMemberStatus } from "@/lib/members/status";
import type { MemberDrawerProps } from "./MemberDrawer.types";
import { memberOrganizationState } from "./memberOrganizationState";
import { useBoardMembershipForm } from "./useBoardMembershipForm";

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
  const [privateEmail, setPrivateEmail] = useState(member.privateEmail ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [teamId, setTeamId] = useState(member.teamId ?? "");
  const [secondaryTeamId, setSecondaryTeamId] = useState(
    member.secondaryTeamId ?? "",
  );
  const [status, setStatus] = useState<MemberStatus>(
    normalizeMemberStatus(member.memberStatus),
  );
  const [role, setRole] = useState<UserRole>(member.role ?? "member");
  const [isTeamLead, setIsTeamLead] = useState(member.isTeamLead ?? false);
  const [isSecondaryTeamLead, setIsSecondaryTeamLead] = useState(
    member.isSecondaryTeamLead ?? false,
  );
  const board = useBoardMembershipForm(member);

  const { teamOptions, departmentOptions, department, chapterTeamIds } =
    memberOrganizationState(teams, departments, teamId);
  const isSaving =
    updateProfile.isPending ||
    setStatusMutation.isPending ||
    updateRole.isPending;

  const handleSave = async () => {
    onSavingChange(true);

    try {
      if (board.isBoardMember && !board.boardDepartmentId) {
        toast.error("Bitte wähle ein Department aus.");
        return;
      }
      if (!board.isBoardMember && status === "active" && !teamId) {
        toast.error("Bitte wähle ein Team aus.");
        return;
      }
      if (!board.isBoardMember && teamId && secondaryTeamId === teamId) {
        toast.error("Hauptteam und weiteres Team müssen unterschiedlich sein.");
        return;
      }
      const profile: {
        userId: string;
        privateEmail?: string | null;
        phone?: string | null;
        teamId?: string | null;
        secondaryTeamId?: string | null;
        isTeamLead?: boolean;
        isSecondaryTeamLead?: boolean;
        boardMembership?: BoardMembership | null;
      } = { userId: member._id };
      const nextPrivateEmail = privateEmail.trim().toLowerCase();
      if (nextPrivateEmail !== (member.privateEmail ?? "")) {
        profile.privateEmail = nextPrivateEmail || null;
      }
      const nextPhone = phone.trim();
      if (nextPhone !== (member.phone ?? "")) {
        profile.phone = nextPhone || null;
      }
      if (board.isBoardMember) {
        if (member.teamId) profile.teamId = null;
      } else if (teamId && teamId !== member.teamId) {
        profile.teamId = teamId;
      }
      if (secondaryTeamId !== (member.secondaryTeamId ?? "")) {
        profile.secondaryTeamId = secondaryTeamId || null;
      }
      const nextIsTeamLead = board.isBoardMember ? false : isTeamLead;
      if (nextIsTeamLead !== (member.isTeamLead ?? false)) {
        profile.isTeamLead = nextIsTeamLead;
      }
      const nextIsSecondaryTeamLead = secondaryTeamId
        ? isSecondaryTeamLead
        : false;
      if (nextIsSecondaryTeamLead !== (member.isSecondaryTeamLead ?? false)) {
        profile.isSecondaryTeamLead = nextIsSecondaryTeamLead;
      }
      const nextBoardMembership = board.isBoardMember
        ? {
            departmentId: board.boardDepartmentId,
            isChair: board.boardIsChair,
          }
        : null;
      const currentBoardMembership = member.boardMembership ?? null;
      if (
        JSON.stringify(nextBoardMembership) !==
        JSON.stringify(currentBoardMembership)
      ) {
        profile.boardMembership = nextBoardMembership;
      }
      if (
        profile.privateEmail !== undefined ||
        profile.phone !== undefined ||
        profile.teamId !== undefined ||
        profile.secondaryTeamId !== undefined ||
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
    privateEmail,
    setPrivateEmail,
    phone,
    setPhone,
    teamId,
    setTeamId,
    secondaryTeamId,
    setSecondaryTeamId,
    status,
    setStatus,
    role,
    setRole,
    isTeamLead,
    setIsTeamLead,
    isSecondaryTeamLead,
    setIsSecondaryTeamLead,
    ...board,
    teamOptions,
    departmentOptions,
    department,
    chapterTeamIds,
    canEditRoles,
    isSaving,
    handleSave,
  };
}

export type MemberDrawerFormState = ReturnType<typeof useMemberDrawerForm>;
