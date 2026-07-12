"use client";

import { PublicSignaturePad } from "@/(public)/_components/PublicSignaturePad";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Props = {
  accountHolder: string;
  iban: string;
  bic: string;
  onAccountHolderChange: (value: string) => void;
  onIbanChange: (value: string) => void;
  onBicChange: (value: string) => void;
  confirmation: boolean;
  signature: string | null;
  onConfirmationChange: (value: boolean) => void;
  onSignatureChange: (value: string) => void;
  formatIban: (iban: string) => string;
  uploadSignature: (blob: Blob) => Promise<string>;
};

export function BankAndConfirmation(props: Props) {
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Bankverbindung</h2>
        <div className="grid gap-4">
          <div>
            <Label>Kontoinhaber *</Label>
            <Input
              value={props.accountHolder}
              onChange={(e) => props.onAccountHolderChange(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <Label>IBAN *</Label>
            <Input
              value={props.formatIban(props.iban)}
              onChange={(e) =>
                props.onIbanChange(e.target.value.replace(/\s/g, ""))
              }
              placeholder="DE89 3704 0044 0532 0130 00"
              className="font-mono"
              maxLength={42}
            />
          </div>
          <div>
            <Label>BIC (optional)</Label>
            <Input
              value={props.bic.toUpperCase()}
              onChange={(e) => props.onBicChange(e.target.value.toUpperCase())}
              placeholder="COBADEFFXXX"
              className="font-mono"
              maxLength={11}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Bestätigung</h2>
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirmation"
            checked={props.confirmation}
            onCheckedChange={(checked) =>
              props.onConfirmationChange(checked === true)
            }
          />
          <Label htmlFor="confirmation" className="text-sm leading-relaxed">
            Ich bestätige, dass alle Angaben korrekt sind und die eingereichten
            Belege tatsächlich entstandene Kosten darstellen.
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Unterschrift</h2>
        <PublicSignaturePad
          onUploadComplete={props.onSignatureChange}
          storageId={props.signature || undefined}
          uploadSignature={props.uploadSignature}
        />
      </div>
    </>
  );
}
