"use client";

import { ReceiptUploadExternal } from "@/components/Reimbursements/ReceiptUploadExternal";
import { InvoiceOrganizationHint } from "@/components/Reimbursements/InvoiceOrganizationHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { CostType, TravelReceipt } from "./types";

type Props = {
  receipt: TravelReceipt;
  costLabels: Record<CostType, string>;
  onRemove: () => void;
  onUpdate: (updates: Partial<TravelReceipt>) => void;
  toNet: (gross: number, tax: number) => number;
  generateUploadUrl: (
    contentType: string,
  ) => Promise<{ key: string; url: string }>;
  getFileUrl: (key: string) => Promise<string | null>;
  organizationName: string;
};

export function TravelReceiptCard(props: Props) {
  const { receipt } = props;
  const isCar = receipt.costType === "car";

  return (
    <div className="@container border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          {isCar ? "PKW (0,30€/km)" : props.costLabels[receipt.costType]}
        </h3>
        <Button variant="ghost" size="icon" onClick={props.onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @4xl:grid-cols-4">
        <div>
          <Label>Name/Firma *</Label>
          <Input
            value={receipt.companyName}
            onChange={(e) => props.onUpdate({ companyName: e.target.value })}
            placeholder="z.B. Deutsche Bahn"
          />
        </div>
        <div>
          <Label>Beleg-/Rechnungsnummer</Label>
          <Input
            value={receipt.receiptNumber ?? ""}
            onChange={(e) =>
              props.onUpdate({ receiptNumber: e.target.value || undefined })
            }
            placeholder="z.B. RE-2026-001 (optional)"
          />
        </div>

        {isCar ? (
          <>
            <div>
              <Label>Kilometer *</Label>
              <Input
                type="number"
                min={0}
                value={receipt.kilometers || ""}
                onChange={(e) => {
                  const kilometers = Math.max(
                    0,
                    Math.floor(parseFloat(e.target.value) || 0),
                  );
                  const amount = Math.round(kilometers * 0.3 * 100) / 100;
                  props.onUpdate({
                    kilometers,
                    grossAmount: amount,
                    netAmount: amount,
                  });
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Betrag</Label>
              <Input
                value={`${receipt.grossAmount.toFixed(2)} €`}
                disabled
                className="bg-muted/50 font-mono"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Brutto (€) *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={receipt.grossAmount || ""}
                onChange={(e) => {
                  const amount = Math.max(0, parseFloat(e.target.value) || 0);
                  props.onUpdate({
                    grossAmount: amount,
                    netAmount: props.toNet(amount, receipt.taxRate),
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>MwSt.</Label>
              <Select
                value={String(receipt.taxRate)}
                onValueChange={(value) => {
                  const tax = parseInt(value, 10);
                  props.onUpdate({
                    taxRate: tax,
                    netAmount: props.toNet(receipt.grossAmount, tax),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="19">19%</SelectItem>
                  <SelectItem value="7">7%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {receipt.grossAmount > 0 && (
        <div className="space-y-3">
          <Label>Beleg *</Label>
          <InvoiceOrganizationHint organizationName={props.organizationName} />
          <ReceiptUploadExternal
            onUploadComplete={(storageId) =>
              props.onUpdate({ fileStorageId: storageId })
            }
            storageId={receipt.fileStorageId || undefined}
            generateUploadUrl={props.generateUploadUrl}
            getFileUrl={props.getFileUrl}
          />
        </div>
      )}
    </div>
  );
}
