"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { BIC_REGEX, formatIban, IBAN_REGEX } from "@/lib/bank-utils";
import { useMutation } from "convex/react";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type BankDetails = { iban: string; bic: string; accountHolder: string };

interface Props {
  value: BankDetails;
  onChange: (value: BankDetails) => void;
}
export function BankDetailsEditor({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const save = useMutation(api.users.functions.updateBankDetails);

  const toggle = async () => {
    if (editing) {
      const iban = value.iban.replace(/\s/g, "").toUpperCase();
      const bic = value.bic.replace(/\s/g, "").toUpperCase();
      if (!value.accountHolder)
        return toast.error("Bitte Kontoinhaber eingeben");
      if (!IBAN_REGEX.test(iban)) return toast.error("Ungültige IBAN");
      if (bic && !BIC_REGEX.test(bic)) return toast.error("Ungültige BIC");
      await save(value);
    }
    setEditing(!editing);
  };

  const update = (key: keyof BankDetails, val: string) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Bankverbindung</h2>
      <div className="flex items-end gap-4">
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 flex-1">
          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              Kontoinhaber *
            </Label>
            <Input
              value={value.accountHolder}
              onChange={(e) => update("accountHolder", e.target.value)}
              disabled={!editing}
              placeholder="Vor- und Nachname"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              IBAN *
            </Label>
            <Input
              value={formatIban(value.iban)}
              onChange={(e) =>
                update("iban", e.target.value.replace(/\s/g, ""))
              }
              disabled={!editing}
              placeholder="DE12 3456 7890 0000 0000 00"
              className="font-mono"
              maxLength={27}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              BIC (optional)
            </Label>
            <Input
              value={value.bic}
              onChange={(e) => update("bic", e.target.value)}
              disabled={!editing}
              placeholder="COBADEFFXXX"
              className="font-mono"
              maxLength={11}
            />
          </div>
        </div>
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={toggle}
        >
          {editing ? "Speichern" : <Pencil className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
