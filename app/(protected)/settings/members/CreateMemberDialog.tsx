"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMemberMutations } from "@/lib/client/members/hooks/useMemberMutations";
import type { Department, Team, User } from "@/lib/db/types";
import { CreateMemberIdentityFields } from "./CreateMemberIdentityFields";
import { CreateMemberProfileField } from "./CreateMemberProfileField";
import { LabeledSelect } from "./LabeledSelect";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (member: User) => void;
  departments: Department[];
  teams: Team[];
}

export function CreateMemberDialog({
  open,
  onOpenChange,
  onCreated,
  departments,
  teams,
}: Props) {
  const { create } = useMemberMutations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [memberPlatformUserId, setMemberPlatformUserId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isTeamLead, setIsTeamLead] = useState(false);
  const activeTeams = teams.filter((team) => !team.isArchived);
  const selectedTeam = activeTeams.find((team) => team._id === teamId);
  const department = departments.find(
    (entry) => entry._id === selectedTeam?.departmentId,
  );
  const isFormComplete = Boolean(
    name.trim() && email.trim() && memberPlatformUserId && teamId,
  );

  const reset = () => {
    setName("");
    setEmail("");
    setMemberPlatformUserId("");
    setTeamId("");
    setIsTeamLead(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (create.isPending) return;
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormComplete || create.isPending) return;

    try {
      const member = await create.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        memberPlatformUserId,
        teamId,
        isTeamLead,
      });
      toast.success("Mitglied im Onboarding angelegt");
      reset();
      onOpenChange(false);
      onCreated(member);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Mitglied konnte nicht angelegt werden",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mitglied manuell anlegen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CreateMemberIdentityFields
            name={name}
            email={email}
            onNameChange={(value) => {
              setName(value);
              setMemberPlatformUserId("");
            }}
            onEmailChange={setEmail}
          >
            <CreateMemberProfileField
              name={name}
              selectedProfileId={memberPlatformUserId}
              disabled={create.isPending}
              onSelect={setMemberPlatformUserId}
            />
          </CreateMemberIdentityFields>
          <LabeledSelect
            id="manual-member-team"
            label="Team*"
            value={teamId}
            onValueChange={(value) => {
              setTeamId(value);
              const team = activeTeams.find((entry) => entry._id === value);
              if (team?.isChapter) setIsTeamLead(false);
            }}
            options={activeTeams.map((team) => ({
              value: team._id,
              label: team.name,
            }))}
            placeholder="Team wählen"
            hint={`Department: ${department?.name ?? "—"}`}
          />
          {selectedTeam && !selectedTeam.isChapter ? (
            <div className="flex items-center gap-3">
              <Checkbox
                id="manual-member-team-lead"
                checked={isTeamLead}
                onCheckedChange={(checked) => setIsTeamLead(checked === true)}
              />
              <Label htmlFor="manual-member-team-lead">Lead</Label>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={create.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormComplete || create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Mitglied anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
