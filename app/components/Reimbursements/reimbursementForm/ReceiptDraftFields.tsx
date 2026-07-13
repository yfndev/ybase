"use client";

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
import { toNet } from "@/lib/bank-utils";
import { formatAmount } from "@/lib/formatters/formatCurrency";
import { Plus } from "lucide-react";
import { InvoiceOrganizationHint } from "../InvoiceOrganizationHint";
import { ReceiptUpload } from "../ReceiptUpload";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  currencySymbol: string;
  receiptCount: number;
  organizationName: string;
  onAddReceipt: () => void;
}

export function ReceiptDraftFields({
  draft,
  setDraft,
  currencySymbol,
  receiptCount,
  organizationName,
  onAddReceipt,
}: Props) {
  const net = draft.gross ? toNet(draft.gross, draft.tax) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Beleg hinzufügen</h2>
      <p className="text-sm text-muted-foreground">
        Du kannst mehrere Belege hinzufügen, um sie in einer Erstattung
        einzureichen.
      </p>
      <InvoiceOrganizationHint organizationName={organizationName} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name/Firma *</Label>
          <Input
            value={draft.company}
            onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            placeholder="z.B. Amazon GmbH, Deutsche Bahn AG"
          />
        </div>
        <div>
          <Label>Beleg-Nr.</Label>
          <Input
            value={draft.number}
            onChange={(e) => setDraft({ ...draft, number: e.target.value })}
            placeholder="z.B. INV-2024-001 (optional)"
          />
        </div>
      </div>

      <div>
        <Label>Beschreibung *</Label>
        <Textarea
          value={draft.desc}
          onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
          placeholder="z.B. Büromaterial für Q1"
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Belegdatum *</Label>
          <DateInput
            value={draft.date}
            onChange={(value) => setDraft({ ...draft, date: value })}
          />
        </div>
        <div>
          <Label>Bruttobetrag ({currencySymbol}) *</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={draft.gross || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                gross: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            placeholder="119,95"
          />
        </div>
        <div>
          <Label>USt.-Satz</Label>
          <Select
            value={String(draft.tax)}
            onValueChange={(value) =>
              setDraft({ ...draft, tax: parseInt(value, 10) })
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
          <Label className="text-muted-foreground">
            Nettobetrag ({currencySymbol})
          </Label>
          <Input
            value={formatAmount(net)}
            disabled
            className="bg-muted/50 font-mono"
          />
        </div>
      </div>

      <div>
        <Label>Beleg hochladen *</Label>
        <ReceiptUpload
          onUploadComplete={(id) => setDraft({ ...draft, file: id })}
          storageId={draft.file || undefined}
        />
      </div>

      <Button
        onClick={onAddReceipt}
        className="w-full"
        variant="outline"
        size="lg"
      >
        {receiptCount === 0 ? (
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
