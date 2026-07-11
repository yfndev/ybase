"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatAmount } from "@/lib/formatters/formatCurrency";
import { Loader2, Trash2 } from "lucide-react";
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
  isSubmitting: boolean;
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
  isSubmitting,
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
                {formatAmount(receipt.grossAmount)} {currencySymbol}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveReceipt(index)}
                className="hover:bg-destructive/10 hover:text-destructive"
                aria-label="Beleg entfernen"
                title="Beleg entfernen"
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
            {formatAmount(totalNet)} {currencySymbol}
          </span>
        </div>
        {tax7 > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">USt 7%</span>
            <span>
              {formatAmount(tax7)} {currencySymbol}
            </span>
          </div>
        )}
        {tax19 > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">USt 19%</span>
            <span>
              {formatAmount(tax19)} {currencySymbol}
            </span>
          </div>
        )}
        <Separator className="my-4" />
        <div className="flex justify-between text-lg font-semibold pt-2">
          <span>Brutto gesamt</span>
          <span>
            {formatAmount(totalGross)} {currencySymbol}
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
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
        Zur Genehmigung einreichen
      </Button>
    </div>
  );
}
