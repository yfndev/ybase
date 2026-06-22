import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "./constants";
import type { AllowanceForm, UpdateField } from "./types";

type Props = {
  form: AllowanceForm;
  updateField: UpdateField;
  updateAmount: (value: string) => void;
};

export function AmountSection({ form, updateField, updateAmount }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Betrag</h2>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div>
          <Label>Betrag in Euro (max. {MAX_VOLUNTEER_ALLOWANCE_EUR}€) *</Label>
          <Input
            type="number"
            step="0.01"
            max={String(MAX_VOLUNTEER_ALLOWANCE_EUR)}
            value={form.amount}
            onChange={(e) => updateAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div>
          <Label>Steuerjahr *</Label>
          <Input
            type="number"
            min="2000"
            max="2099"
            value={form.taxYear}
            onChange={(e) => updateField("taxYear", e.target.value)}
            placeholder={String(new Date().getFullYear())}
          />
        </div>
      </div>
    </div>
  );
}
