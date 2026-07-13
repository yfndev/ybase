import { DateInput } from "@/components/Selectors/DateInput";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectTravelDefaults } from "@/lib/db/types";
import { Copy, Loader2, Mail } from "lucide-react";
import { TYPE_LABELS } from "./constants";
import type { LinkType, ShareModalUIProps } from "./types";

type ShareFormProps = Pick<
  ShareModalUIProps,
  | "type"
  | "form"
  | "projects"
  | "isGenerating"
  | "needsDates"
  | "onTypeChange"
  | "onFormUpdate"
  | "onCopy"
  | "onSend"
>;

export function ShareForm({
  type,
  form,
  projects,
  isGenerating,
  needsDates,
  onTypeChange,
  onFormUpdate,
  onCopy,
  onSend,
}: ShareFormProps) {
  const handleProjectChange = (
    value: string,
    selectedProject: ProjectTravelDefaults | undefined = projects.find(
      (project) => project._id === value,
    ),
  ) => {
    onFormUpdate({
      projectId: value || null,
      destination: selectedProject?.travelDestination ?? "",
      purpose: selectedProject?.travelPurpose ?? "",
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex gap-2">
        {(Object.keys(TYPE_LABELS) as LinkType[]).map((linkType) => (
          <Button
            key={linkType}
            type="button"
            variant={type === linkType ? "default" : "outline"}
            onClick={() => onTypeChange(linkType)}
            className="h-12 flex-1"
          >
            {TYPE_LABELS[linkType]}
          </Button>
        ))}
      </div>

      <div>
        <Label>Projekt</Label>
        <SelectProject
          value={form.projectId ?? ""}
          onValueChange={handleProjectChange}
          projects={projects}
        />
      </div>

      <div>
        <Label>
          {type === "allowance" ? "Tätigkeitsbeschreibung" : "Beschreibung"}
        </Label>
        <Textarea
          value={form.description}
          onChange={(e) => onFormUpdate({ description: e.target.value })}
          placeholder={
            type === "allowance"
              ? "z.B. Jugendarbeit, Vorstandstätigkeit"
              : "z.B. Einkäufe für Workshop"
          }
          rows={2}
          className="resize-none"
        />
      </div>

      {type === "travel" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reiseziel</Label>
              <Input
                value={form.destination}
                onChange={(e) => onFormUpdate({ destination: e.target.value })}
                placeholder="z.B. München"
              />
            </div>
            <div>
              <Label>Reisezweck</Label>
              <Input
                value={form.purpose}
                onChange={(e) => onFormUpdate({ purpose: e.target.value })}
                placeholder="z.B. Konferenz"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowFoodAllowance"
              checked={form.allowFoodAllowance}
              onCheckedChange={(checked) =>
                onFormUpdate({ allowFoodAllowance: checked === true })
              }
            />
            <Label
              htmlFor="allowFoodAllowance"
              className="font-normal cursor-pointer"
            >
              Verpflegungsmehraufwand erlauben
            </Label>
          </div>
        </>
      )}

      {needsDates && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Von</Label>
            <DateInput
              value={form.startDate}
              onChange={(value) => onFormUpdate({ startDate: value })}
            />
          </div>
          <div>
            <Label>Bis</Label>
            <DateInput
              value={form.endDate}
              onChange={(value) => onFormUpdate({ endDate: value })}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Empfängername (optional)</Label>
          <Input
            value={form.invitedName}
            onChange={(event) =>
              onFormUpdate({ invitedName: event.target.value })
            }
            placeholder="Max Mustermann"
          />
        </div>
        <div>
          <Label>Empfänger-E-Mail</Label>
          <Input
            type="email"
            value={form.invitedEmail}
            onChange={(event) =>
              onFormUpdate({ invitedEmail: event.target.value })
            }
            placeholder="max@beispiel.de"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={onCopy}
          className="h-12 w-full"
          disabled={isGenerating || !form.projectId}
        >
          <Copy className="size-4 mr-2" />
          Link kopieren
        </Button>
        <Button
          onClick={onSend}
          className="h-12 w-full"
          disabled={isGenerating || !form.projectId || !form.invitedEmail}
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Mail className="size-4 mr-2" />
          )}
          Per E-Mail senden
        </Button>
      </div>
    </div>
  );
}
