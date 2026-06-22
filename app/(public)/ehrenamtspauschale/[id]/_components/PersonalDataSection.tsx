import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AllowanceForm, UpdateField } from "./types";

type Props = {
  form: AllowanceForm;
  updateField: UpdateField;
};

export function PersonalDataSection({ form, updateField }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Persönliche Daten</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Name *</Label>
          <Input
            value={form.volunteerName}
            onChange={(event) =>
              updateField("volunteerName", event.target.value)
            }
            placeholder="Vor- und Nachname"
          />
        </div>
        <div className="col-span-2">
          <Label>Straße und Hausnummer *</Label>
          <Input
            value={form.volunteerStreet}
            onChange={(event) =>
              updateField("volunteerStreet", event.target.value)
            }
            placeholder="Musterstraße 123"
          />
        </div>
        <div>
          <Label>PLZ *</Label>
          <Input
            value={form.volunteerPlz}
            onChange={(event) =>
              updateField("volunteerPlz", event.target.value)
            }
            placeholder="12345"
          />
        </div>
        <div>
          <Label>Ort *</Label>
          <Input
            value={form.volunteerCity}
            onChange={(event) =>
              updateField("volunteerCity", event.target.value)
            }
            placeholder="Musterstadt"
          />
        </div>
      </div>
    </div>
  );
}
