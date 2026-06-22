"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { sumGross, sumNet, taxForRate } from "./helpers";
import type { BankDetails, Receipt } from "./types";

interface Props {
  receipts: Receipt[];
  currencySymbol: string;
  bank: BankDetails;
  onBankChange: (value: BankDetails) => void;
  onRemoveReceipt: (index: number) => void;
  signature: string | null;
  onSignatureComplete: (value: string) => void;
  onSubmit: () => void;
}

export function ReimbursementSummary({
  receipts,
  currencySymbol,
  bank,
  onBankChange,
  onRemoveReceipt,
  signature,
  onSignatureComplete,
  onSubmit,
}: Props) {
  const totalGross = sumGross(receipts);
  const totalNet = sumNet(receipts);
  const tax7 = taxForRate(receipts, 7);
  const tax19 = taxForRate(receipts, 19);

  return (
    <div className="space-y-8 mt-24">
      <h2 className="text-2xl font-bold">Zusammenfassung</h2>
      <BankDetailsEditor value={bank} onChange={onBankChange} />

      <div className="space-y-3">
        {receipts.map((receipt, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-3 bg-gray-50 border rounded-md"
          >
            <div className="flex items-center gap-8 flex-1">
              <span className="font-semibold">{receipt.companyName}</span>
              <span className="text-sm text-muted-foreground">
                {receipt.description}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                {receipt.grossAmount.toFixed(2)} {currencySymbol}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveReceipt(index)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Netto gesamt</span>
          <span>
            {totalNet.toFixed(2)} {currencySymbol}
          </span>
        </div>
        {tax7 > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">UST 7% gesamt</span>
            <span>
              {tax7.toFixed(2)} {currencySymbol}
            </span>
          </div>
        )}
        {tax19 > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">UST 19% gesamt</span>
            <span>
              {tax19.toFixed(2)} {currencySymbol}
            </span>
          </div>
        )}
        <Separator className="my-4" />
        <div className="flex justify-between text-lg font-semibold pt-2">
          <span>Brutto gesamt</span>
          <span>
            {totalGross.toFixed(2)} {currencySymbol}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Unterschrift *</h2>
        <SignatureField
          onSignatureComplete={onSignatureComplete}
          storageId={signature || undefined}
        />
      </div>

      <Button
        onClick={onSubmit}
        className="w-full h-14 font-semibold mt-8"
        size="lg"
      >
        Zur Genehmigung einreichen
      </Button>
    </div>
  );
}
