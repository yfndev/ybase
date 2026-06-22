import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AllowanceForm, UpdateField } from "./types";

type Props = {
  form: AllowanceForm;
  updateField: UpdateField;
};

export function ActivitySection({ form, updateField }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Tätigkeit</h2>
      <div>
        <Label>Beschreibung der nebenberuflichen Tätigkeit *</Label>
        <Textarea
          value={form.activityDescription}
          onChange={(event) =>
            updateField("activityDescription", event.target.value)
          }
          placeholder="z.B. Übungsleiter, Jugendarbeit, Vorstandstätigkeit"
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Von *</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
          />
        </div>
        <div>
          <Label>Bis *</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
