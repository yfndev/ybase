import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { STATUS_DISPLAY } from "@/lib/reimbursementStatus";
import type { Reimbursement } from "./types";

export function ReimbursementSummary({
  reimbursement,
  totalGross,
}: {
  reimbursement: Reimbursement;
  totalGross: number;
}) {
  const display =
    STATUS_DISPLAY[reimbursement.status] ?? STATUS_DISPLAY.pending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Badge variant={display.variant} className={display.className}>
          {display.label}
        </Badge>
        <span className="text-muted-foreground">
          {reimbursement.type === "travel"
            ? "Reisekostenerstattung"
            : "Auslagenerstattung"}
        </span>
      </div>
      <p className="text-3xl font-bold">{formatCurrency(totalGross)}</p>
    </div>
  );
}
