import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { CAR_ALLOWANCE_RATE_EUR_PER_KM } from "@/lib/travel-costs";
import { ExternalLink, FileText } from "lucide-react";
import { COST_TYPE_LABELS } from "./constants";
import type { ReceiptWithUrl } from "./types";

export function ReceiptCard({ receipt }: { receipt: ReceiptWithUrl }) {
  const isPdf = receipt.fileContentType === "application/pdf";

  return (
    <div className="border rounded-lg p-4 flex gap-4">
      {receipt.fileUrl ? (
        <a
          href={receipt.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/30"
          aria-label="Beleg in neuem Tab öffnen"
        >
          {isPdf ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="size-12" />
              <span className="text-xs font-medium">PDF öffnen</span>
            </div>
          ) : (
            <img
              src={receipt.fileUrl}
              alt="Beleg"
              className="size-full object-cover"
            />
          )}
          <span className="absolute right-1.5 top-1.5 rounded bg-background/90 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ExternalLink className="size-3.5" />
          </span>
        </a>
      ) : (
        <div className="flex size-32 shrink-0 flex-col items-center justify-center gap-2 rounded border bg-muted/30 text-muted-foreground">
          <FileText className="size-10" />
          <span className="text-xs">Kein Beleg nötig</span>
        </div>
      )}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{receipt.companyName}</p>
            {receipt.costType === "car" ? (
              <p className="text-sm text-muted-foreground">
                Kilometerpauschale • {formatDate(receipt.receiptDate)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Beleg-/Rechnungsnummer {receipt.receiptNumber || "–"} •{" "}
                {formatDate(receipt.receiptDate)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(receipt.grossAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(receipt.netAmount)} netto + {receipt.taxRate}%
              USt.
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
                {receipt.kilometers} km ×{" "}
                {formatCurrency(CAR_ALLOWANCE_RATE_EUR_PER_KM)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
