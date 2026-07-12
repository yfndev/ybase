"use client";

import { ReceiptUpload } from "@/components/Reimbursements/ReceiptUpload";
import { ReceiptAddressNotice } from "@/components/Reimbursements/ReceiptAddressNotice";
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
import {
  CAR_ALLOWANCE_RATE_EUR_PER_KM,
  COST_LABELS as LABELS,
  type CostType,
} from "@/lib/travel-costs";
import { Trash2 } from "lucide-react";
import { PLACEHOLDERS } from "./constants";
import type { Receipt } from "./types";

interface Props {
  receipt: Receipt;
  toggleType: (type: CostType) => void;
  updateReceipt: (type: CostType, updates: Partial<Receipt>) => void;
}

export function ReceiptCard({ receipt, toggleType, updateReceipt }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          {receipt.costType === "car"
            ? `PKW (${formatCurrency(CAR_ALLOWANCE_RATE_EUR_PER_KM)}/km)`
            : LABELS[receipt.costType]}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleType(receipt.costType)}
          aria-label="Position entfernen"
          title="Position entfernen"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Firma/Anbieter *</Label>
          <Input
            value={receipt.companyName}
            onChange={(e) =>
              updateReceipt(receipt.costType, {
                companyName: e.target.value,
              })
            }
            placeholder={PLACEHOLDERS[receipt.costType]}
          />
        </div>
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
                  updateReceipt(receipt.costType, {
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
                  updateReceipt(receipt.costType, {
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
                  const tax = parseInt(value);
                  updateReceipt(receipt.costType, {
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

      {(receipt.grossAmount > 0 || receipt.fileStorageId) && (
        <div className="space-y-3">
          {receipt.costType !== "car" ? <ReceiptAddressNotice /> : null}
          <Label>Beleg *</Label>
          <ReceiptUpload
            onUploadComplete={(id) =>
              updateReceipt(receipt.costType, { fileStorageId: id })
            }
            storageId={receipt.fileStorageId || undefined}
          />
        </div>
      )}
    </div>
  );
}
