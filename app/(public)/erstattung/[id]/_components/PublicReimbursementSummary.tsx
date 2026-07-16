"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { CAR_ALLOWANCE_RATE_EUR_PER_KM } from "@/lib/travel-costs";
import type { CostType, Receipt, TravelReceipt } from "./types";

type Props = {
  isTravel: boolean;
  receipts: Receipt[];
  travelReceipts: TravelReceipt[];
  mealTotal: number;
  overnightTotal: number;
  totalGross: number;
  costLabels: Record<CostType, string>;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function PublicReimbursementSummary(props: Props) {
  const costs: Array<{
    receipt: Receipt;
    title: string;
    detail: string;
    key: string;
  }> = props.isTravel
    ? props.travelReceipts
        .filter((receipt) => receipt.grossAmount > 0)
        .map((receipt) => ({
          receipt,
          title: props.costLabels[receipt.costType],
          detail:
            receipt.costType === "car"
              ? `${receipt.kilometers ?? 0} km × ${formatCurrency(CAR_ALLOWANCE_RATE_EUR_PER_KM)}`
              : receipt.description,
          key: receipt.costType,
        }))
    : props.receipts.map((receipt, index) => ({
        receipt,
        title: receipt.companyName,
        detail: receipt.description,
        key: `${receipt.fileStorageId ?? index}-${receipt.companyName}`,
      }));
  const totalNet = costs.reduce((sum, item) => sum + item.receipt.netAmount, 0);
  const taxForRate = (rate: number) =>
    costs
      .filter((item) => item.receipt.taxRate === rate)
      .reduce(
        (sum, item) => sum + item.receipt.grossAmount - item.receipt.netAmount,
        0,
      );
  const isEmpty =
    costs.length === 0 && props.mealTotal === 0 && props.overnightTotal === 0;

  return (
    <aside
      className="space-y-6 border-2 p-5 sm:p-6"
      aria-label="Zusammenfassung"
    >
      <h2 className="text-lg font-bold">Zusammenfassung</h2>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Kosten erfasst.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {costs.map(({ receipt, title, detail, key }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 border bg-muted px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{title}</p>
                  {detail ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {detail}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(receipt.grossAmount)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            {totalNet > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Netto gesamt</span>
                <span className="tabular-nums">{formatCurrency(totalNet)}</span>
              </div>
            ) : null}
            {[7, 19].map((rate) => {
              const tax = taxForRate(rate);
              return tax > 0 ? (
                <div key={rate} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">USt {rate}%</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
              ) : null;
            })}
            {props.mealTotal > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Verpflegung</span>
                <span className="tabular-nums">
                  {formatCurrency(props.mealTotal)}
                </span>
              </div>
            ) : null}
            {props.overnightTotal > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Übernachtungspauschale
                </span>
                <span className="tabular-nums">
                  {formatCurrency(props.overnightTotal)}
                </span>
              </div>
            ) : null}
            <Separator className="my-3" />
            <div className="flex justify-between gap-4 text-lg font-semibold">
              <span>Kosten gesamt</span>
              <span className="tabular-nums">
                {formatCurrency(props.totalGross)}
              </span>
            </div>
          </div>
        </>
      )}

      <Button
        onClick={props.onSubmit}
        variant="primary"
        className="h-14 w-full font-semibold"
        size="lg"
        disabled={props.isSubmitting || isEmpty}
      >
        {props.isSubmitting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : null}
        Einreichen
      </Button>
    </aside>
  );
}
