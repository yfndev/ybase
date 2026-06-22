"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { COST_LABELS as LABELS } from "@/lib/travel-costs";
import type { BankDetails, Receipt } from "./types";

interface Props {
  bank: BankDetails;
  setBank: (value: BankDetails) => void;
  receipts: Receipt[];
  totalNet: number;
  taxByRate: (rate: number) => number;
  mealTotal: number;
  total: number;
  signature: string | null;
  setSignature: (value: string | null) => void;
  handleSubmit: () => void;
}

export function SummarySection({
  bank,
  setBank,
  receipts,
  totalNet,
  taxByRate,
  mealTotal,
  total,
  signature,
  setSignature,
  handleSubmit,
}: Props) {
  return (
    <div className="space-y-8 mt-24">
      <h2 className="text-2xl font-bold">Zusammenfassung</h2>
      <BankDetailsEditor value={bank} onChange={setBank} />

      <div className="space-y-3">
        {receipts
          .filter((receipt) => receipt.grossAmount > 0)
          .map((receipt) => (
            <div
              key={receipt.costType}
              className="flex items-center justify-between px-3 bg-gray-50 border rounded-md"
            >
              <div className="flex items-center gap-8 flex-1">
                <span className="font-semibold">
                  {LABELS[receipt.costType]}
                </span>
                {receipt.costType === "car" && (
                  <span className="text-sm text-muted-foreground">
                    {receipt.kilometers} km × 0,30€
                  </span>
                )}
              </div>
              <span className="font-semibold">
                {receipt.grossAmount.toFixed(2)} €
              </span>
            </div>
          ))}
      </div>

      <div className="space-y-2 pt-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Netto gesamt</span>
          <span>{totalNet.toFixed(2)} €</span>
        </div>
        {taxByRate(0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">USt 0%</span>
            <span>{taxByRate(0).toFixed(2)} €</span>
          </div>
        )}
        {taxByRate(7) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">USt 7%</span>
            <span>{taxByRate(7).toFixed(2)} €</span>
          </div>
        )}
        {taxByRate(19) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">USt 19%</span>
            <span>{taxByRate(19).toFixed(2)} €</span>
          </div>
        )}
        {mealTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verpflegung</span>
            <span>{mealTotal.toFixed(2)} €</span>
          </div>
        )}
        <Separator className="my-4" />
        <div className="flex justify-between text-lg font-semibold pt-2">
          <span>Brutto gesamt</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Unterschrift *</h2>
        <SignatureField
          onSignatureComplete={setSignature}
          storageId={signature || undefined}
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-14 font-semibold mt-8"
        size="lg"
      >
        Zur Genehmigung einreichen
      </Button>
    </div>
  );
}
