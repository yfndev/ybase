import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIban } from "./helpers";
import type { AllowanceForm, UpdateField } from "./types";

type Props = {
  form: AllowanceForm;
  updateField: UpdateField;
};

export function BankSection({ form, updateField }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Bankverbindung</h2>
      <div className="grid gap-4">
        <div>
          <Label>Kontoinhaber *</Label>
          <Input
            value={form.accountHolder}
            onChange={(event) =>
              updateField("accountHolder", event.target.value)
            }
            placeholder="Max Mustermann"
          />
        </div>
        <div>
          <Label>IBAN *</Label>
          <Input
            value={formatIban(form.iban)}
            onChange={(event) =>
              updateField("iban", event.target.value.replace(/\s/g, ""))
            }
            placeholder="DE89 3704 0044 0532 0130 00"
            className="font-mono"
            maxLength={27}
          />
        </div>
        <div>
          <Label>BIC (optional)</Label>
          <Input
            value={form.bic.toUpperCase()}
            onChange={(event) =>
              updateField("bic", event.target.value.toUpperCase())
            }
            placeholder="COBADEFFXXX"
            className="font-mono"
            maxLength={11}
          />
        </div>
      </div>
    </div>
  );
}
