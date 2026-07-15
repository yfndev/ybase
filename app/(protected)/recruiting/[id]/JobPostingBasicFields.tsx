"use client";

import { SelectMembers } from "@/components/Selectors/SelectMembers";
import { SelectTeam } from "@/components/Selectors/SelectTeam";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import { useTeamDirectory } from "@/lib/client/teams/hooks/useTeamDirectory";
import type { JobPostingFormValues } from "@/lib/jobPostings/form";

interface Props {
  values: JobPostingFormValues;
  onChange: (patch: Partial<JobPostingFormValues>) => void;
}

export function JobPostingBasicFields({ values, onChange }: Props) {
  const { teams, lookup } = useTeamDirectory();
  const { members, isLoading: areMembersLoading } = useMembers();
  const departmentName = lookup.get(values.teamId)?.departmentName ?? "–";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="jp-title">Titel*</Label>
        <Input
          id="jp-title"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="jp-short">Kurztext</Label>
        <Textarea
          id="jp-short"
          value={values.shortText}
          onChange={(e) => onChange({ shortText: e.target.value })}
          placeholder="Kurze Zusammenfassung"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="jp-team">Team*</Label>
          <SelectTeam
            id="jp-team"
            teams={teams}
            value={values.teamId || undefined}
            onValueChange={(teamId) => onChange({ teamId })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Department</Label>
          <div className="flex h-12 items-center border-2 border-input bg-muted px-4 text-sm text-muted-foreground">
            {departmentName}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="jp-time">Zeitaufwand</Label>
          <Input
            id="jp-time"
            value={values.timeCommitment}
            onChange={(e) => onChange({ timeCommitment: e.target.value })}
            placeholder="z. B. 5 h/Woche"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jp-deadline">Frist</Label>
          <Input
            id="jp-deadline"
            type="date"
            value={values.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="jp-contacts">Ansprechpartner</Label>
        <SelectMembers
          id="jp-contacts"
          members={members}
          value={values.contactUserIds}
          isLoading={areMembersLoading}
          onValueChange={(contactUserIds) => onChange({ contactUserIds })}
        />
      </div>
    </div>
  );
}
