"use client";

import { SignatureField } from "@/components/Reimbursements/SignatureField";
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
  signature: string | null;
  onSignatureChange: (value: string) => void;
  formatIban: (iban: string) => string;
  uploadSignature: (blob: Blob) => Promise<string>;
  getFileUrl: (storageId: string) => Promise<string | null>;
};

export function BankAndSignature(props: Props) {
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
        <h2 className="text-lg font-medium">Unterschrift *</h2>
        <SignatureField
          onSignatureComplete={props.onSignatureChange}
          storageId={props.signature || undefined}
          uploadSignature={props.uploadSignature}
          getFileUrl={props.getFileUrl}
          onClear={() => props.onSignatureChange("")}
          allowMobileHandoff={false}
        />
      </div>
    </>
  );
}
