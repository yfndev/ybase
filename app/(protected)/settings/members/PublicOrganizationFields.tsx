import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LabeledSelect } from "./LabeledSelect";
import type { MemberDrawerFormState } from "./useMemberDrawerForm";

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
        <>
          <LabeledSelect
            id="member-team"
            label="Team"
            value={form.teamId}
            onValueChange={form.setTeamId}
            options={form.teamOptions}
            placeholder="Team wählen"
            hint={`Department: ${form.department?.name ?? "—"}`}
          />
          <div className="flex items-center gap-3">
            <Checkbox
              id="member-team-lead"
              checked={form.isTeamLead}
              onCheckedChange={(checked) =>
                form.setIsTeamLead(checked === true)
              }
            />
            <Label htmlFor="member-team-lead">Team-Lead</Label>
          </div>
        </>
      )}
    </fieldset>
  );
}
