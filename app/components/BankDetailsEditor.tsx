"use client";

import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatIban,
  getBankDetailsError,
  normalizeIban,
} from "@/lib/bank-utils";
import { updateBankDetails } from "@/lib/server/users/profile";

type BankDetails = { iban: string; bic: string; accountHolder: string };

interface Props {
  value: BankDetails;
  onChange: (value: BankDetails) => void;
}
export function BankDetailsEditor({ value, onChange }: Props) {
  const [editing, setEditing] = useState(() => !!getBankDetailsError(value));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    const iban = normalizeIban(value.iban);
    const bic = value.bic.replace(/\s/g, "").toUpperCase();
    const normalized = { accountHolder: value.accountHolder.trim(), iban, bic };
    const validationError = getBankDetailsError(normalized);
    if (validationError) return toast.error(validationError);
    setIsSaving(true);
    try {
      await updateBankDetails(normalized);
      onChange(normalized);
      toast.success("Bankverbindung gespeichert");
      router.refresh();
      setEditing(false);
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: keyof BankDetails, val: string) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Bankverbindung</h2>
      <div className="flex flex-col gap-4 sm:items-end lg:flex-row">
        <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr]">
          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              Kontoinhaber *
            </Label>
            <Input
              value={value.accountHolder}
              onChange={(e) => update("accountHolder", e.target.value)}
              disabled={!editing}
              placeholder="Vor- und Nachname"
              required
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
              maxLength={42}
              required
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
          type="button"
          variant={editing ? "default" : "outline"}
          className="h-[52px] w-full border-input px-4 hover:border-ring focus-visible:border-foreground focus-visible:ring-0 sm:w-auto md:h-12 md:min-w-12"
          onClick={toggle}
          disabled={isSaving}
          aria-label={editing ? "Speichern" : "Bearbeiten"}
          title={editing ? undefined : "Bearbeiten"}
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Speichern" : <Pencil className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
