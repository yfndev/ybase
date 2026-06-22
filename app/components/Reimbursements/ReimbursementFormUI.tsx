"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { DateInput } from "@/components/Selectors/DateInput";
import { SelectProject } from "@/components/Selectors/SelectProject";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, CURRENCY_SYMBOLS, toNet } from "@/lib/bank-utils";
import type { Project, Receipt as ReceiptDoc } from "@/lib/db/types";
import { createReimbursement } from "@/lib/server/reimbursements/actions";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ReceiptUpload } from "./ReceiptUpload";

type BankDetails = { iban: string; bic: string; accountHolder: string };
type Receipt = Omit<
  ReceiptDoc,
  "_id" | "_creationTime" | "reimbursementId" | "costType" | "kilometers"
>;

interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
}

export function ReimbursementFormUI({ defaultBankDetails, projects }: Props) {
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [currency, setCurrency] = useState("EUR");
  const [signature, setSignature] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [draft, setDraft] = useState({
    company: "",
    number: "",
    desc: "",
    date: "",
    gross: 0,
    tax: 19,
    file: null as string | null,
  });

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const net = draft.gross ? toNet(draft.gross, draft.tax) : 0;
  const totalGross = receipts.reduce(
    (sum, receipt) => sum + receipt.grossAmount,
    0,
  );
  const totalNet = receipts.reduce(
    (sum, receipt) => sum + receipt.netAmount,
    0,
  );
  const taxByRate = (rate: number) =>
    receipts
      .filter((receipt) => receipt.taxRate === rate)
      .reduce(
        (sum, receipt) => sum + receipt.grossAmount - receipt.netAmount,
        0,
      );

  const addReceipt = () => {
    if (!draft.company || !draft.desc || !draft.gross || !draft.file || !draft.date) {
      return toast.error("Bitte Pflichtfelder ausfüllen (Firma, Beschreibung, Betrag, Belegdatum, Beleg)");
    }
    if (draft.gross < 0) {
      return toast.error("Betrag muss positiv sein");
    }
    setReceipts([
      ...receipts,
      {
        receiptNumber: draft.number || undefined,
        receiptDate: draft.date,
        companyName: draft.company,
        description: draft.desc,
        netAmount: toNet(draft.gross, draft.tax),
        taxRate: draft.tax,
        grossAmount: draft.gross,
        fileStorageId: draft.file,
      },
    ]);
    setDraft({
      company: "",
      number: "",
      desc: "",
      date: "",
      gross: 0,
      tax: 19,
      file: null,
    });
    toast.success(`Beleg ${receipts.length + 1} hinzugefügt`);
  };

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Bitte ein Projekt auswählen");
    if (receipts.length === 0) return toast.error("Bitte mindestens einen Beleg hinzufügen");
    if (!signature) return toast.error("Bitte unterschreiben");
    try {
      await createReimbursement({
        projectId,
        amount: totalGross,
        ...bank,
        currency,
        signatureStorageId: signature,
        receipts,
      });
      toast.success("Erstattung eingereicht");
      router.push("/reimbursements");
    } catch {
      toast.error("Fehler beim Einreichen");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-end gap-4">
        <div className="w-[200px]">
          <Label>Projekt *</Label>
          <SelectProject
            value={projectId || ""}
            onValueChange={(value) => setProjectId(value || null)}
            projects={projects}
          />
        </div>
        <div className="w-[120px]">
          <Label>Währung</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur} ({CURRENCY_SYMBOLS[cur]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Beleg hinzufügen</h2>
        <p className="text-sm text-muted-foreground">
          Du kannst mehrere Belege hinzufügen, um sie in einer Erstattung
          einzureichen.
        </p>
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
              value={draft.gross || ""}
              onChange={(e) =>
                setDraft({ ...draft, gross: parseFloat(e.target.value) || 0 })
              }
              placeholder="119,95"
            />
          </div>
          <div>
            <Label>Wie viel MwSt.?</Label>
            <Select
              value={String(draft.tax)}
              onValueChange={(value) =>
                setDraft({ ...draft, tax: parseInt(value) })
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
            <Label className="text-muted-foreground">Nettobetrag ({currencySymbol})</Label>
            <Input
              value={net.toFixed(2)}
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
          onClick={addReceipt}
          className="w-full"
          variant="outline"
          size="lg"
        >
          <Plus className="size-5 mr-2" />
          {receipts.length === 0
            ? "Beleg hinzufügen"
            : "Weiteren Beleg hinzufügen"}
        </Button>
      </div>

      {receipts.length > 0 && (
        <div className="space-y-8 mt-24">
          <h2 className="text-2xl font-bold">Zusammenfassung</h2>
          <BankDetailsEditor value={bank} onChange={setBank} />

          <div className="space-y-3">
            {receipts.map((receipt, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 bg-gray-50 border rounded-md"
              >
                <div className="flex items-center gap-8 flex-1">
                  <span className="font-semibold">{receipt.companyName}</span>
                  <span className="text-sm text-muted-foreground">
                    {receipt.description}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {receipt.grossAmount.toFixed(2)} {currencySymbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setReceipts(receipts.filter((_, idx) => idx !== index))
                    }
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Netto gesamt</span>
              <span>{totalNet.toFixed(2)} {currencySymbol}</span>
            </div>
            {taxByRate(7) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">UST 7% gesamt</span>
                <span>{taxByRate(7).toFixed(2)} {currencySymbol}</span>
              </div>
            )}
            {taxByRate(19) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">UST 19% gesamt</span>
                <span>{taxByRate(19).toFixed(2)} {currencySymbol}</span>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-semibold pt-2">
              <span>Brutto gesamt</span>
              <span>{totalGross.toFixed(2)} {currencySymbol}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">Unterschrift *</h2>
            <SignatureField
              onSignatureComplete={setSignature}
              storageId={signature || undefined}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full h-14 font-semibold mt-8"
            size="lg"
          >
            Zur Genehmigung einreichen
          </Button>
        </div>
      )}
    </div>
  );
}
