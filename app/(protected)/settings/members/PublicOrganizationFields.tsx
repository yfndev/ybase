import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LabeledSelect } from "./LabeledSelect";
import type { MemberDrawerFormState } from "./useMemberDrawerForm";

const NO_SECONDARY_TEAM = "__none__";

export function PublicOrganizationFields({
  form,
}: {
  form: MemberDrawerFormState;
}) {
  return (
    <fieldset className="grid gap-4 border-t pt-5">
      <legend className="pr-3 text-sm font-semibold">Organisation</legend>

      <div className="flex items-center gap-3">
        <Checkbox
          id="member-board"
          checked={form.isBoardMember}
          onCheckedChange={(checked) => form.setIsBoardMember(checked === true)}
        />
        <Label htmlFor="member-board">Vorstand</Label>
      </div>

      {form.isBoardMember ? (
        <div className="grid gap-4">
          <LabeledSelect
            id="member-board-department"
            label="Department"
            value={form.boardDepartmentId}
            onValueChange={form.setBoardDepartmentId}
            options={form.departmentOptions}
            placeholder="Department wählen"
          />
          <div className="flex items-center gap-3">
            <Checkbox
              id="member-board-chair"
              checked={form.boardIsChair}
              onCheckedChange={(checked) =>
                form.setBoardIsChair(checked === true)
              }
            />
            <Label htmlFor="member-board-chair">Vorsitz</Label>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <LabeledSelect
            id="member-team"
            label="Hauptteam"
            value={form.teamId}
            onValueChange={(teamId) => {
              form.setTeamId(teamId);
              if (form.chapterTeamIds.has(teamId)) {
                form.setIsTeamLead(false);
              }
              if (teamId === form.secondaryTeamId) {
                form.setSecondaryTeamId("");
                form.setIsSecondaryTeamLead(false);
              }
            }}
            options={form.teamOptions}
            placeholder="Team wählen"
            hint={`Department: ${form.department?.name ?? "—"}`}
          />
          {form.teamId && !form.chapterTeamIds.has(form.teamId) ? (
            <div className="flex items-center gap-3">
              <Checkbox
                id="member-team-lead"
                checked={form.isTeamLead}
                onCheckedChange={(checked) =>
                  form.setIsTeamLead(checked === true)
                }
              />
              <Label htmlFor="member-team-lead">Lead</Label>
            </div>
          ) : null}
        </div>
      )}

      <LabeledSelect
        id="member-secondary-team"
        label="Weiteres Team (optional)"
        value={form.secondaryTeamId || NO_SECONDARY_TEAM}
        onValueChange={(teamId) => {
          const nextTeamId = teamId === NO_SECONDARY_TEAM ? "" : teamId;
          form.setSecondaryTeamId(nextTeamId);
          if (!nextTeamId || form.chapterTeamIds.has(nextTeamId)) {
            form.setIsSecondaryTeamLead(false);
          }
        }}
        options={[
          {
            value: NO_SECONDARY_TEAM,
            label: "Kein weiteres Team",
          },
          ...form.teamOptions.map((option) => ({
            ...option,
            disabled: !form.isBoardMember && option.value === form.teamId,
          })),
        ]}
      />
      {form.secondaryTeamId &&
      !form.chapterTeamIds.has(form.secondaryTeamId) ? (
        <div className="flex items-center gap-3">
          <Checkbox
            id="member-secondary-team-lead"
            checked={form.isSecondaryTeamLead}
            onCheckedChange={(checked) =>
              form.setIsSecondaryTeamLead(checked === true)
            }
          />
          <Label htmlFor="member-secondary-team-lead">Lead</Label>
        </div>
      ) : null}
    </fieldset>
  );
}
