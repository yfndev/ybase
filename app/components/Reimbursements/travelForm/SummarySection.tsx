"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import {
  CAR_ALLOWANCE_RATE_EUR_PER_KM,
  COST_LABELS as LABELS,
} from "@/lib/travel-costs";
import { Loader2 } from "lucide-react";
import type { Receipt } from "./types";

interface Props {
  receipts: Receipt[];
  totalNet: number;
  taxByRate: (rate: number) => number;
  mealTotal: number;
  overnightTotal: number;
  total: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  handleSubmit: () => void;
}

export function SummarySection({
  receipts,
  totalNet,
  taxByRate,
  mealTotal,
  overnightTotal,
  total,
  isSubmitting,
  canSubmit,
  handleSubmit,
}: Props) {
  const items = receipts.filter((receipt) => receipt.grossAmount > 0);
  const isEmpty = items.length === 0 && mealTotal === 0 && overnightTotal === 0;

  return (
    <div className="space-y-6 border-2 p-6">
      <h2 className="text-lg font-bold">Zusammenfassung</h2>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Kosten erfasst.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((receipt) => (
              <div
                key={receipt.costType}
                className="flex items-start justify-between gap-2 border bg-muted px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {LABELS[receipt.costType]}
                  </div>
                  {receipt.costType === "car" && (
                    <div className="text-sm text-muted-foreground">
                      {receipt.kilometers} km ×{" "}
                      {formatCurrency(CAR_ALLOWANCE_RATE_EUR_PER_KM)}
                    </div>
                  )}
                </div>
                <span className="font-semibold whitespace-nowrap">
                  {formatCurrency(receipt.grossAmount)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Netto gesamt</span>
              <span>{formatCurrency(totalNet)}</span>
            </div>
            {taxByRate(7) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">USt 7%</span>
                <span>{formatCurrency(taxByRate(7))}</span>
              </div>
            )}
            {taxByRate(19) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">USt 19%</span>
                <span>{formatCurrency(taxByRate(19))}</span>
              </div>
            )}
            {mealTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verpflegung</span>
                <span>{formatCurrency(mealTotal)}</span>
              </div>
            )}
            {overnightTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Übernachtungspauschale
                </span>
                <span>{formatCurrency(overnightTotal)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Brutto gesamt</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {canSubmit && (
            <Button
              onClick={handleSubmit}
              variant="primary"
              className="w-full h-14 font-semibold"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
              Zur Genehmigung einreichen
            </Button>
          )}
        </>
      )}
    </div>
  );
}
