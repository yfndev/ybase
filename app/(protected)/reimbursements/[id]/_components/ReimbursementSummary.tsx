import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { STATUS_MAP } from "./constants";
import type { Reimbursement } from "./types";

export function ReimbursementSummary({
  reimbursement,
  totalGross,
}: {
  reimbursement: Reimbursement;
  totalGross: number;
}) {
  const { label: statusLabel, variant: statusVariant } =
    STATUS_MAP[reimbursement.status] ?? STATUS_MAP.pending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Badge variant={statusVariant}>{statusLabel}</Badge>
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
