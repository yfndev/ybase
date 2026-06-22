import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import type { ReceiptWithUrl } from "./types";
import { sumGross, sumNet, taxForRate } from "./totals";

export function TotalsSummary({ receipts }: { receipts: ReceiptWithUrl[] }) {
  const totalNet = sumNet(receipts);
  const totalGross = sumGross(receipts);
  const taxByRate = (rate: number) => taxForRate(receipts, rate);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Netto gesamt</span>
        <span>{formatCurrency(totalNet)}</span>
      </div>
      {taxByRate(0) > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">USt 0%</span>
          <span>{formatCurrency(taxByRate(0))}</span>
        </div>
      )}
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
      <Separator />
      <div className="flex justify-between text-lg font-semibold">
        <span>Brutto gesamt</span>
        <span>{formatCurrency(totalGross)}</span>
      </div>
    </div>
  );
}
