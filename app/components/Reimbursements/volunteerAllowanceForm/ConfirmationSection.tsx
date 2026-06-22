"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { VolunteerAllowanceForm } from "./types";

interface Props {
  form: VolunteerAllowanceForm;
  update: (field: Partial<VolunteerAllowanceForm>) => void;
}

export function ConfirmationSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Bestätigung</h2>
      <div className="flex items-start gap-3">
        <Checkbox
          id="confirm"
          checked={form.confirmed}
          onCheckedChange={(checked) => update({ confirmed: checked === true })}
        />
        <Label htmlFor="confirm" className="text-sm leading-relaxed">
          Ich erkläre, dass die Steuerbefreiung nach § 3 Nr. 26a EStG für
          nebenberufliche ehrenamtliche Tätigkeit in Höhe von{" "}
          {form.amount || "0,00"} Euro für das Jahr {form.taxYear} in Anspruch
          genommen werden kann. Sollte sich im Lauf des Jahres eine Änderung
          ergeben, informiere ich hierüber unverzüglich den Verein. Mir ist
          bekannt, dass andernfalls Nachteile des Vereins zu meinen Lasten
          gehen.
        </Label>
      </div>
    </div>
  );
}
