"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Receipt } from "./types";

type Props = {
  receipts: Receipt[];
  onRemoveReceipt: (index: number) => void;
};

export function AddedReceiptsList(props: Props) {
  if (props.receipts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Hinzugefügte Belege</h3>
      {props.receipts.map((receipt, index) => (
        <div
          key={receipt.fileStorageId}
          className="flex flex-col gap-3 border bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{receipt.companyName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {receipt.description || "Keine Beschreibung"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="font-medium tabular-nums">
              {receipt.grossAmount.toFixed(2)} €
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => props.onRemoveReceipt(index)}
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
  );
}
