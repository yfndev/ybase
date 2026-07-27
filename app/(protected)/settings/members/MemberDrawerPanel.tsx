import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetFooter } from "@/components/ui/sheet";
import type { TeamOnboardingStatus, User, UserRole } from "@/lib/db/types";
import { getInitials } from "@/lib/formatters/getInitials";
import { Loader2 } from "lucide-react";
import { LabeledSelect } from "./LabeledSelect";
import { MemberStatusField } from "./MemberStatusField";
import {
  memberStatusLabel,
  memberStatusVariant,
  ROLE_OPTIONS,
  TEAM_ONBOARDING_OPTIONS,
} from "./memberLabels";
import type { MemberDrawerFormState } from "./useMemberDrawerForm";

interface Props {
  member: User;
  displayName: string;
  form: MemberDrawerFormState;
  onClose: () => void;
}

export function MemberDrawerPanel({
  member,
  displayName,
  form,
  onClose,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-row items-center gap-5 px-6 pt-8 pb-6 text-left">
        <Avatar className="size-24">
          <AvatarImage
            src={member.image}
            alt={`Profilbild von ${displayName}`}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(displayName, member.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <h2 className="text-[1.625rem] leading-tight font-semibold break-words">
            {displayName}
          </h2>
          <p className="text-muted-foreground max-w-full truncate text-base">
            {member.email || "Keine E-Mail hinterlegt"}
          </p>
          <Badge className="mt-1" variant={memberStatusVariant(form.status)}>
            {memberStatusLabel(form.status)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6">
        <LabeledSelect
          id="member-team"
          label="Team"
          value={form.teamId}
          onValueChange={form.setTeamId}
          options={form.teamOptions}
          placeholder="Team wählen"
          hint={`Department: ${form.department?.name ?? "—"}`}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="member-position">Position</Label>
          <Input
            id="member-position"
            value={form.position}
            onChange={(event) => form.setPosition(event.target.value)}
            placeholder="z. B. Tech Lead"
          />
        </div>
        <MemberStatusField
          status={form.status}
          onboarding={form.onboarding}
          onChange={form.setStatus}
        />
        <LabeledSelect
          id="member-onboarding"
          label="Onboarding-Aufgaben"
          value={form.onboarding}
          onValueChange={(value) =>
            form.setOnboarding(value as TeamOnboardingStatus)
          }
          options={TEAM_ONBOARDING_OPTIONS}
          disabled={member.memberStatus === "active"}
        />
        <LabeledSelect
          id="member-role"
          label="Rolle"
          value={form.role}
          onValueChange={(value) => form.setRole(value as UserRole)}
          options={ROLE_OPTIONS}
          disabled={!form.canEditRoles}
          hint={
            form.canEditRoles
              ? undefined
              : "Rollen können nur von Admins geändert werden."
          }
        />
      </div>

      <SheetFooter className="mt-6 border-t px-6 pt-6 pb-6">
        <Button
          variant="primary"
          onClick={form.handleSave}
          disabled={form.isSaving}
        >
          {form.isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
        <Button variant="outline" onClick={onClose} disabled={form.isSaving}>
          Abbrechen
        </Button>
      </SheetFooter>
    </div>
  );
}
