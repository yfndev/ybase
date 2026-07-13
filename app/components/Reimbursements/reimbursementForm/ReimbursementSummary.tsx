"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatAmount } from "@/lib/formatters/formatCurrency";
import { Loader2, Trash2 } from "lucide-react";
import { sumGross, sumNet, taxForRate } from "./helpers";
import type { Receipt } from "./types";

interface Props {
  receipts: Receipt[];
  currencySymbol: string;
  onRemoveReceipt: (index: number) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function ReimbursementSummary({
  receipts,
  currencySymbol,
  onRemoveReceipt,
  isSubmitting,
  onSubmit,
}: Props) {
  const totalGross = sumGross(receipts);
  const totalNet = sumNet(receipts);
  const tax7 = taxForRate(receipts, 7);
  const tax19 = taxForRate(receipts, 19);

  return (
    <div className="space-y-6 border-2 p-6">
      <h2 className="text-lg font-bold">Zusammenfassung</h2>

      {receipts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Belege hinzugefügt. Füge links einen Beleg hinzu.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {receipts.map((receipt, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-2 border bg-muted px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {receipt.companyName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {receipt.description}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-semibold whitespace-nowrap">
                    {formatAmount(receipt.grossAmount)} {currencySymbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveReceipt(index)}
                    className="size-8 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Beleg entfernen"
                    title="Beleg entfernen"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
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
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Brutto gesamt</span>
              <span>
                {formatAmount(totalGross)} {currencySymbol}
              </span>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            variant="primary"
            className="w-full h-14 font-semibold"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
            Zur Genehmigung einreichen
          </Button>
        </>
      )}
    </div>
  );
}
