"use client";

import { ReceiptUpload } from "@/components/Reimbursements/ReceiptUpload";
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
import { toNet } from "@/lib/bank-utils";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { CAR_ALLOWANCE_RATE_EUR_PER_KM } from "@/lib/travel-costs";
import { Trash2 } from "lucide-react";
import { InvoiceOrganizationHint } from "../InvoiceOrganizationHint";
import { PLACEHOLDERS } from "./constants";
import type { Receipt } from "./types";

interface Props {
  receipt: Receipt;
  title: string;
  onRemove: () => void;
  onUpdate: (updates: Partial<Receipt>) => void;
  organizationName: string;
}

export function ReceiptCard({
  receipt,
  title,
  onRemove,
  onUpdate,
  organizationName,
}: Props) {
  return (
    <fieldset className="@container min-w-0 border rounded-lg p-4 space-y-4">
      <legend className="sr-only">{title}</legend>
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          {receipt.costType === "car"
            ? `${title} (${formatCurrency(CAR_ALLOWANCE_RATE_EUR_PER_KM)}/km)`
            : title}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`${title} entfernen`}
          title={`${title} entfernen`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @4xl:grid-cols-4">
        {receipt.costType !== "car" ? (
          <>
            <div>
              <Label>Firma/Anbieter *</Label>
              <Input
                value={receipt.companyName}
                onChange={(e) =>
                  onUpdate({
                    companyName: e.target.value,
                  })
                }
                placeholder={PLACEHOLDERS[receipt.costType]}
              />
            </div>
            <div>
              <Label className="break-all">Beleg-/Rechnungsnummer</Label>
              <Input
                value={receipt.receiptNumber ?? ""}
                onChange={(e) =>
                  onUpdate({
                    receiptNumber: e.target.value || undefined,
                  })
                }
                placeholder="z.B. RE-2026-001 (optional)"
              />
            </div>
          </>
        ) : null}
        {receipt.costType === "car" ? (
          <>
            <div>
              <Label>Kilometer *</Label>
              <Input
                type="number"
                min={0}
                value={receipt.kilometers || ""}
                onChange={(e) => {
                  const km = Math.max(
                    0,
                    Math.floor(parseFloat(e.target.value) || 0),
                  );
                  const amount =
                    Math.round(km * CAR_ALLOWANCE_RATE_EUR_PER_KM * 100) / 100;
                  onUpdate({
                    kilometers: km,
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
                value={formatCurrency(receipt.grossAmount)}
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
                  const gross = Math.max(0, parseFloat(e.target.value) || 0);
                  onUpdate({
                    grossAmount: gross,
                    netAmount: toNet(gross, receipt.taxRate),
                  });
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>USt.-Satz</Label>
              <Select
                value={String(receipt.taxRate)}
                onValueChange={(value) => {
                  const tax = parseInt(value, 10);
                  onUpdate({
                    taxRate: tax,
                    netAmount: toNet(receipt.grossAmount, tax),
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

      {receipt.costType !== "car" &&
        (receipt.grossAmount > 0 || receipt.fileStorageId) && (
          <div className="space-y-3">
            <Label>Beleg *</Label>
            <InvoiceOrganizationHint organizationName={organizationName} />
            <ReceiptUpload
              onUploadComplete={(id) => onUpdate({ fileStorageId: id })}
              storageId={receipt.fileStorageId || undefined}
            />
          </div>
        )}
    </fieldset>
  );
}
