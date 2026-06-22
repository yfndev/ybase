"use client";

import { ReceiptUploadExternal } from "@/components/Reimbursements/ReceiptUploadExternal";
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
import { Plus } from "lucide-react";
import { AddedReceiptsList } from "./AddedReceiptsList";
import type { Receipt } from "./types";

type Props = {
  company: string;
  number: string;
  description: string;
  date: string;
  gross: number;
  taxRate: number;
  currency: string;
  file: string | null;
  receipts: Receipt[];
  onCompanyChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onGrossChange: (value: number) => void;
  onTaxRateChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
  onFileChange: (value: string | null) => void;
  onAddReceipt: () => void;
  onRemoveReceipt: (index: number) => void;
  toNet: (gross: number, tax: number) => number;
  generateUploadUrl: (
    contentType: string,
  ) => Promise<{ key: string; url: string }>;
  getFileUrl: (key: string) => Promise<string | null>;
};

export function SimpleReceiptsSection(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Belege</h2>
      <p className="text-sm text-muted-foreground">
        Füge alle Belege hinzu, die du einreichen möchtest.
      </p>

      <div className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name/Firma *</Label>
            <Input
              value={props.company}
              onChange={(e) => props.onCompanyChange(e.target.value)}
              placeholder="z.B. Amazon"
            />
          </div>
          <div>
            <Label>Beleg-Nr.</Label>
            <Input
              value={props.number}
              onChange={(e) => props.onNumberChange(e.target.value)}
              placeholder="z.B. INV-2024-001"
            />
          </div>
        </div>

        <div>
          <Label>Beschreibung *</Label>
          <Input
            value={props.description}
            onChange={(e) => props.onDescriptionChange(e.target.value)}
            placeholder="z.B. Büromaterial"
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Belegdatum *</Label>
            <Input
              type="date"
              value={props.date}
              onChange={(e) => props.onDateChange(e.target.value)}
            />
          </div>
          <div>
            <Label>Brutto *</Label>
            <div className="flex gap-1">
              <Select
                value={props.currency}
                onValueChange={props.onCurrencyChange}
              >
                <SelectTrigger className="w-20 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                value={props.gross || ""}
                onChange={(e) =>
                  props.onGrossChange(parseFloat(e.target.value) || 0)
                }
                placeholder="119.95"
              />
            </div>
          </div>
          <div>
            <Label>MwSt.</Label>
            <Select
              value={String(props.taxRate)}
              onValueChange={(value) => props.onTaxRateChange(parseInt(value))}
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
            <Label className="text-muted-foreground">Netto</Label>
            <Input
              value={
                props.gross
                  ? props.toNet(props.gross, props.taxRate).toFixed(2)
                  : ""
              }
              disabled
              className="bg-muted/50 font-mono"
            />
          </div>
        </div>

        <div>
          <Label>Beleg hochladen *</Label>
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
        >
          <Plus className="size-5 mr-2" />
          {props.receipts.length === 0
            ? "Beleg hinzufügen"
            : "Weiteren Beleg hinzufügen"}
        </Button>
      </div>

      <AddedReceiptsList
        receipts={props.receipts}
        onRemoveReceipt={props.onRemoveReceipt}
      />
    </div>
  );
}
