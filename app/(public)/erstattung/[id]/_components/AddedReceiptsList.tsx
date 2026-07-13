"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
          className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-md"
        >
          <div className="flex items-center gap-4">
            <span className="font-medium">{receipt.companyName}</span>
            <span className="text-sm text-muted-foreground">
              {receipt.description || "Keine Beschreibung"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {receipt.grossAmount.toFixed(2)} €
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => props.onRemoveReceipt(index)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
