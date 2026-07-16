"use client";

import { Plus } from "lucide-react";
import { InvoiceOrganizationHint } from "@/components/Reimbursements/InvoiceOrganizationHint";
import { ReceiptUploadExternal } from "@/components/Reimbursements/ReceiptUploadExternal";
import { DateInput } from "@/components/Selectors/DateInput";
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
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/formatters/formatCurrency";
import type { Receipt } from "./types";

type Props = {
  organizationName: string;
  company: string;
  number: string;
  description: string;
  date: string;
  gross: number;
  taxRate: number;
  file: string | null;
  receipts: Receipt[];
  onCompanyChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onGrossChange: (value: number) => void;
  onTaxRateChange: (value: number) => void;
  onFileChange: (value: string | null) => void;
  onAddReceipt: () => void;
  toNet: (gross: number, tax: number) => number;
  generateUploadUrl: (
    contentType: string,
  ) => Promise<{ key: string; url: string }>;
  getFileUrl: (key: string) => Promise<string | null>;
};

export function SimpleReceiptsSection(props: Props) {
  const net = props.gross ? props.toNet(props.gross, props.taxRate) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Beleg hinzufügen</h2>
      <p className="text-sm text-muted-foreground">
        Du kannst mehrere Belege hinzufügen, um sie in einer Erstattung
        einzureichen.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Name/Firma *</Label>
          <Input
            value={props.company}
            onChange={(event) => props.onCompanyChange(event.target.value)}
            placeholder="z.B. Amazon GmbH, Deutsche Bahn AG"
          />
        </div>
        <div>
          <Label>Beleg-/Rechnungsnummer</Label>
          <Input
            value={props.number}
            onChange={(event) => props.onNumberChange(event.target.value)}
            placeholder="z.B. INV-2024-001 (optional)"
          />
        </div>
      </div>

      <div>
        <Label>Beschreibung *</Label>
        <Textarea
          value={props.description}
          onChange={(event) => props.onDescriptionChange(event.target.value)}
          placeholder="z.B. Büromaterial für Q1"
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Belegdatum *</Label>
          <DateInput value={props.date} onChange={props.onDateChange} />
        </div>
        <div>
          <Label>Bruttobetrag (€) *</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={props.gross || ""}
            onChange={(event) =>
              props.onGrossChange(
                Math.max(0, parseFloat(event.target.value) || 0),
              )
            }
            placeholder="119,95"
          />
        </div>
        <div>
          <Label>USt.-Satz</Label>
          <Select
            value={String(props.taxRate)}
            onValueChange={(value) =>
              props.onTaxRateChange(parseInt(value, 10))
            }
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
        <div>
          <Label className="text-muted-foreground">Nettobetrag (€)</Label>
          <Input
            value={formatAmount(net)}
            disabled
            className="bg-muted/50 font-mono"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Beleg hochladen *</Label>
        <InvoiceOrganizationHint organizationName={props.organizationName} />
        <ReceiptUploadExternal
          onUploadComplete={props.onFileChange}
          storageId={props.file || undefined}
          generateUploadUrl={props.generateUploadUrl}
          getFileUrl={props.getFileUrl}
        />
      </div>

      <Button
        onClick={props.onAddReceipt}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {props.receipts.length === 0 ? (
          "Beleg speichern"
        ) : (
          <>
            <Plus className="size-5 mr-2" />
            Weiteren Beleg hinzufügen
          </>
        )}
      </Button>
    </div>
  );
}
