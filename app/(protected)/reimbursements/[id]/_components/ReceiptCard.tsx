import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { COST_TYPE_LABELS } from "./constants";
import type { ReceiptWithUrl } from "./types";

export function ReceiptCard({ receipt }: { receipt: ReceiptWithUrl }) {
  return (
    <div className="border rounded-lg p-4 flex gap-4">
      <img
        src={receipt.fileUrl}
        alt="Beleg"
        className="w-32 h-32 object-cover rounded border"
      />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{receipt.companyName}</p>
            <p className="text-sm text-muted-foreground">
              Beleg-Nr. {receipt.receiptNumber} •
              {formatDate(receipt.receiptDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(receipt.grossAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(receipt.netAmount)} netto +{receipt.taxRate}% USt
            </p>
          </div>
        </div>
        {receipt.description && (
          <p className="text-sm text-muted-foreground">{receipt.description}</p>
        )}
        {receipt.costType && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {COST_TYPE_LABELS[receipt.costType] || receipt.costType}
            </Badge>
            {receipt.kilometers && (
              <span className="text-sm text-muted-foreground">
                {receipt.kilometers} km × 0,30€
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
