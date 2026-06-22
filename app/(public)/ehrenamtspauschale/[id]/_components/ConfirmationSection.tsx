import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AllowanceForm, UpdateField } from "./types";

type Props = {
  form: AllowanceForm;
  updateField: UpdateField;
};

export function ConfirmationSection({ form, updateField }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Bestätigung</h2>
      <div className="flex items-start gap-3">
        <Checkbox
          id="confirmation"
          checked={form.confirmation}
          onCheckedChange={(checked) =>
            updateField("confirmation", checked === true)
          }
        />
        <Label htmlFor="confirmation" className="text-sm leading-relaxed">
          Ich erkläre, dass die Steuerbefreiung nach § 3 Nr. 26a EStG für
          nebenberufliche ehrenamtliche Tätigkeit in Höhe von{" "}
          {form.amount || "0,00"} Euro in Anspruch genommen werden kann. Sollte
          sich im Lauf des Jahres eine Änderung ergeben, informiere ich hierüber
          unverzüglich den Verein.
        </Label>
      </div>
    </div>
  );
}
