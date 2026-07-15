"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type {
  Department,
  MemberStatus,
  Team,
  TeamOnboardingStatus,
  User,
  UserRole,
} from "@/lib/db/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { LabeledSelect } from "./LabeledSelect";
import { MemberStatusField } from "./MemberStatusField";
import { ROLE_OPTIONS, TEAM_ONBOARDING_OPTIONS } from "./memberLabels";

const LAST_ADMIN_MESSAGE =
  "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.";

interface Props {
  member: User;
  teams: Team[];
  departments: Department[];
  canEditRoles: boolean;
  adminCount: number;
  onClose: () => void;
}

export function MemberDrawer({
  member,
  teams,
  departments,
  canEditRoles,
  adminCount,
  onClose,
}: Props) {
  const { updateProfile, setStatus, setOnboarding, updateRole } =
    useMemberMutations();

  const [teamId, setTeamId] = useState(member.teamId ?? "");
  const [position, setPosition] = useState(member.positionTitle ?? "");
  const [status, setStatusDraft] = useState<MemberStatus>(member.memberStatus);
  const [onboarding, setOnboardingDraft] = useState<TeamOnboardingStatus>(
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
    setStatus.isPending ||
    setOnboarding.isPending ||
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
        await setOnboarding.mutateAsync({
          userId: member._id,
          status: onboarding,
        });

      if (status !== member.memberStatus)
        await setStatus.mutateAsync({ userId: member._id, status });

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

  return (
    <Sheet open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{member.name || "Teammitglied"}</SheetTitle>
          <SheetDescription>{member.email || "Keine E-Mail"}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <LabeledSelect
            id="member-team"
            label="Team"
            value={teamId}
            onValueChange={setTeamId}
            options={teamOptions}
            placeholder="Team wählen"
            hint={`Department: ${department?.name ?? "—"}`}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="member-position">Position</Label>
            <Input
              id="member-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="z. B. Tech Lead"
            />
          </div>

          <MemberStatusField
            status={status}
            onboarding={onboarding}
            onChange={setStatusDraft}
          />

          <LabeledSelect
            id="member-onboarding"
            label="Onboarding-Aufgaben"
            value={onboarding}
            onValueChange={(value) =>
              setOnboardingDraft(value as TeamOnboardingStatus)
            }
            options={TEAM_ONBOARDING_OPTIONS}
            disabled={member.memberStatus === "active"}
          />

          <LabeledSelect
            id="member-role"
            label="Rolle"
            value={role}
            onValueChange={(value) => setRole(value as UserRole)}
            options={ROLE_OPTIONS}
            disabled={!canEditRoles}
            hint={
              canEditRoles
                ? undefined
                : "Rollen können nur von Admins geändert werden."
            }
          />
        </div>

        <SheetFooter>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
