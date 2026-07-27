import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicTeamIcon } from "@/lib/db/types";
import { LabeledSelect } from "./LabeledSelect";
import type { MemberDrawerFormState } from "./useMemberDrawerForm";

const ICON_OPTIONS = [
  { value: "education", label: "Education" },
  { value: "partnerships", label: "Partnerships" },
  { value: "marketing", label: "Marketing" },
  { value: "community", label: "Community" },
  { value: "operations", label: "Operations" },
  { value: "tech", label: "Tech" },
  { value: "growth", label: "Growth" },
  { value: "network", label: "Network" },
];

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(9999, Math.max(0, Math.round(parsed)))
    : 0;
}

export function PublicTeamProfileFields({
  form,
  memberName,
  memberRole,
}: {
  form: MemberDrawerFormState;
  memberName: string;
  memberRole?: string;
}) {
  return (
    <fieldset className="grid gap-4 border-t pt-5">
      <legend className="pr-3 text-sm font-semibold">
        Öffentliche Team-Seite
      </legend>
      <div className="flex items-start gap-3">
        <Checkbox
          id="member-public-published"
          checked={form.isPublished}
          onCheckedChange={(checked) => form.setIsPublished(checked === true)}
        />
        <Label
          htmlFor="member-public-published"
          className="grid gap-0.5 text-sm"
        >
          <span className="font-medium">
            Auf der Team-Seite veröffentlichen
          </span>
          <span className="text-muted-foreground">
            Es werden ausschließlich die hier freigegebenen Angaben übertragen.
          </span>
        </Label>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="member-public-name">Öffentlicher Name</Label>
        <Input
          id="member-public-name"
          maxLength={100}
          value={form.publicDisplayName}
          onChange={(event) => form.setPublicDisplayName(event.target.value)}
          placeholder={memberName}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="member-public-role">Öffentliche Rolle</Label>
        <Input
          id="member-public-role"
          maxLength={100}
          value={form.publicRole}
          onChange={(event) => form.setPublicRole(event.target.value)}
          placeholder={memberRole || "z. B. Tech Lead"}
        />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="member-public-lead"
          checked={form.isTeamLead}
          onCheckedChange={(checked) => form.setIsTeamLead(checked === true)}
        />
        <Label htmlFor="member-public-lead">Team-Lead</Label>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="member-public-order">Sortierung</Label>
        <Input
          id="member-public-order"
          type="number"
          min={0}
          max={9999}
          value={form.publicSortOrder}
          onChange={(event) =>
            form.setPublicSortOrder(numberValue(event.target.value))
          }
        />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="member-public-board"
          checked={form.isBoardMember}
          onCheckedChange={(checked) => form.setIsBoardMember(checked === true)}
        />
        <Label htmlFor="member-public-board">Im Vorstand anzeigen</Label>
      </div>
      {form.isBoardMember ? (
        <div className="grid gap-4 border-l-2 pl-4">
          <div className="grid gap-1.5">
            <Label htmlFor="member-board-role">Vorstandsressort</Label>
            <Input
              id="member-board-role"
              maxLength={100}
              value={form.boardRole}
              onChange={(event) => form.setBoardRole(event.target.value)}
              placeholder="z. B. Tech"
            />
          </div>
          <LabeledSelect
            id="member-board-icon"
            label="Icon"
            value={form.boardIcon}
            onValueChange={(value) =>
              form.setBoardIcon(value as PublicTeamIcon)
            }
            options={ICON_OPTIONS}
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
          <div className="grid gap-1.5">
            <Label htmlFor="member-board-order">Vorstandssortierung</Label>
            <Input
              id="member-board-order"
              type="number"
              min={0}
              max={9999}
              value={form.boardSortOrder}
              onChange={(event) =>
                form.setBoardSortOrder(numberValue(event.target.value))
              }
            />
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
