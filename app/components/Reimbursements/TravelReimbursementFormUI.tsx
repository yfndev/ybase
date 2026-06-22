"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { ReceiptUpload } from "@/components/Reimbursements/ReceiptUpload";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { DateInput } from "@/components/Selectors/DateInput";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toNet } from "@/lib/bank-utils";
import type { Project, Receipt as ReceiptDoc } from "@/lib/db/types";
import { createTravelReimbursement } from "@/lib/server/reimbursements/actions";
import {
  CAR_ALLOWANCE_RATE_EUR_PER_KM,
  COST_LABELS as LABELS,
  COST_TYPES,
  type CostType,
  DEFAULT_TAX_RATES,
  MEAL_ALLOWANCE_FULL_DAY_EUR,
  MEAL_ALLOWANCE_PARTIAL_DAY_EUR,
} from "@/lib/travel-costs";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type BankDetails = { iban: string; bic: string; accountHolder: string };
type Receipt = Omit<
  ReceiptDoc,
  "_id" | "_creationTime" | "reimbursementId"
> & { costType: CostType };

const PLACEHOLDERS: Record<CostType, string> = {
  car: "Eigenfahrt, Miles, Sixt, etc.",
  train: "Deutsche Bahn, Flix, etc.",
  flight: "Lufthansa, Ryanair, etc.",
  taxi: "Uber, Bolt, etc.",
  bus: "Flixbus, etc.",
  accommodation: "Hotel, Airbnb, etc.",
};

interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
}

export function TravelReimbursementFormUI({
  defaultBankDetails,
  projects,
}: Props) {
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [signature, setSignature] = useState<string | null>(null);
  const [showMealAllowance, setShowMealAllowance] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [travel, setTravel] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    isInternational: false,
    mealDays: 0,
    mealRate: 0,
  });

  const update = (field: Partial<typeof travel>) =>
    setTravel((prev) => ({ ...prev, ...field }));

  const hasReceipt = (type: CostType) =>
    receipts.some((receipt) => receipt.costType === type);

  const toggleType = (type: CostType) => {
    if (hasReceipt(type)) {
      return setReceipts(
        receipts.filter((receipt) => receipt.costType !== type)
      );
    }
    setReceipts([
      ...receipts,
      {
        costType: type,
        receiptNumber: `${type.toUpperCase()}-001`,
        receiptDate: travel.startDate,
        companyName: "",
        description: "",
        netAmount: 0,
        taxRate: DEFAULT_TAX_RATES[type],
        grossAmount: 0,
        fileStorageId: "",
        kilometers: type === "car" ? 0 : undefined,
      },
    ]);
  };

  const updateReceipt = (type: CostType, updates: Partial<Receipt>) =>
    setReceipts(
      receipts.map((receipt) =>
        receipt.costType === type ? { ...receipt, ...updates } : receipt
      )
    );

  const hasBasicInfo =
    travel.destination &&
    travel.purpose &&
    travel.startDate &&
    travel.endDate &&
    travel.endDate >= travel.startDate;
  const mealTotal = travel.mealDays * travel.mealRate;
  const totalNet = receipts.reduce((sum, receipt) => sum + receipt.netAmount, 0);
  const totalGross = receipts.reduce(
    (sum, receipt) => sum + receipt.grossAmount,
    0,
  );
  const total = totalGross + mealTotal;
  const taxByRate = (rate: number) =>
    receipts
      .filter((receipt) => receipt.taxRate === rate)
      .reduce((sum, receipt) => sum + receipt.grossAmount - receipt.netAmount, 0);
  const allComplete = receipts.every(
    (receipt) =>
      receipt.grossAmount > 0 && receipt.fileStorageId && receipt.companyName
  );
  const canSubmit =
    hasBasicInfo &&
    (receipts.length > 0 || mealTotal > 0) &&
    (receipts.length === 0 || allComplete) &&
    projectId &&
    signature;

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Bitte ein Projekt auswählen");
    if (!signature) return toast.error("Bitte unterschreiben");
    try {
      await createTravelReimbursement({
        projectId,
        amount: total,
        ...bank,
        signatureStorageId: signature,
        startDate: travel.startDate,
        endDate: travel.endDate,
        destination: travel.destination,
        purpose: travel.purpose,
        isInternational: travel.isInternational,
        mealAllowanceDays: travel.mealDays || undefined,
        mealAllowanceDailyBudget: travel.mealRate || undefined,
        receipts,
      });
      toast.success("Reisekostenerstattung eingereicht");
      router.push("/reimbursements");
    } catch {
      toast.error("Fehler beim Einreichen");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="w-[200px]">
        <Label>Projekt *</Label>
        <SelectProject
          value={projectId || ""}
          onValueChange={(value) => setProjectId(value || null)}
          projects={projects}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Reiseangaben</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Reiseziel *</Label>
            <Input
              value={travel.destination}
              onChange={(e) => update({ destination: e.target.value })}
              placeholder="z.B. München, Berlin"
            />
          </div>
          <div>
            <Label>Reisezweck *</Label>
            <Input
              value={travel.purpose}
              onChange={(e) => update({ purpose: e.target.value })}
              placeholder="z.B. Kundentermin, Konferenz"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Reisebeginn *</Label>
            <DateInput
              value={travel.startDate}
              onChange={(value) => update({ startDate: value })}
            />
          </div>
          <div>
            <Label>Reiseende *</Label>
            <DateInput
              value={travel.endDate}
              onChange={(value) => update({ endDate: value })}
            />
          </div>
          <div className="col-span-2 flex items-end pb-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="international"
                checked={travel.isInternational}
                onCheckedChange={(checked) =>
                  update({ isInternational: checked === true })
                }
              />
              <Label htmlFor="international" className="font-normal">
                Auslandsreise
              </Label>
            </div>
          </div>
        </div>
      </div>

      {hasBasicInfo && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">Kostenarten auswählen</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Wähle alle Kostenarten aus, für die du Belege einreichen möchtest.
            </p>
            <div className="flex flex-wrap gap-2">
              {COST_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={hasReceipt(type) ? "default" : "outline"}
                  onClick={() => toggleType(type)}
                >
                  {LABELS[type]}
                </Button>
              ))}
            </div>
          </div>

          {receipts.map((receipt) => (
            <div
              key={receipt.costType}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  {receipt.costType === "car"
                    ? "PKW (0,30€/km)"
                    : LABELS[receipt.costType]}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleType(receipt.costType)}
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
                            Math.floor(parseFloat(e.target.value) || 0)
                          );
                          const amount = Math.round(km * CAR_ALLOWANCE_RATE_EUR_PER_KM * 100) / 100;
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
                          const gross = Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          );
                          updateReceipt(receipt.costType, {
                            grossAmount: gross,
                            netAmount: toNet(gross, receipt.taxRate),
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

              {receipt.grossAmount > 0 && (
                <div>
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
          ))}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mealAllowance"
                checked={showMealAllowance}
                onCheckedChange={(checked) => {
                  setShowMealAllowance(checked === true);
                  if (!checked) update({ mealDays: 0, mealRate: 0 });
                }}
              />
              <Label htmlFor="mealAllowance" className="font-normal cursor-pointer">
                Verpflegungsmehraufwand geltend machen
              </Label>
            </div>

            {showMealAllowance && (
              <div className="border rounded-lg p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Bitte nur ausfüllen, wenn dies vorab mit deinem Lead abgesprochen
                  wurde! Ansonsten werden die Reisekosten nicht erstattet.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tage</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0}
                      value={travel.mealDays || ""}
                      onChange={(e) =>
                        update({ mealDays: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="z.B. 2.5"
                    />
                  </div>
                  <div>
                    <Label>Tagessatz (€)</Label>
                    <Select
                      value={travel.mealRate ? String(travel.mealRate) : ""}
                      onValueChange={(value) =>
                        update({ mealRate: parseFloat(value) || 0 })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14">{MEAL_ALLOWANCE_PARTIAL_DAY_EUR} € (8-24h)</SelectItem>
                        <SelectItem value="28">{MEAL_ALLOWANCE_FULL_DAY_EUR} € (24h+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Betrag</Label>
                    <Input
                      value={`${mealTotal.toFixed(2)} €`}
                      disabled
                      className="bg-muted/50 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="space-y-8 mt-24">
          <h2 className="text-2xl font-bold">Zusammenfassung</h2>
          <BankDetailsEditor value={bank} onChange={setBank} />

          <div className="space-y-3">
            {receipts
              .filter((receipt) => receipt.grossAmount > 0)
              .map((receipt) => (
                <div
                  key={receipt.costType}
                  className="flex items-center justify-between px-3 bg-gray-50 border rounded-md"
                >
                  <div className="flex items-center gap-8 flex-1">
                    <span className="font-semibold">
                      {LABELS[receipt.costType]}
                    </span>
                    {receipt.costType === "car" && (
                      <span className="text-sm text-muted-foreground">
                        {receipt.kilometers} km × 0,30€
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">
                    {receipt.grossAmount.toFixed(2)} €
                  </span>
                </div>
              ))}
          </div>

          <div className="space-y-2 pt-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Netto gesamt</span>
              <span>{totalNet.toFixed(2)} €</span>
            </div>
            {taxByRate(0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">USt 0%</span>
                <span>{taxByRate(0).toFixed(2)} €</span>
              </div>
            )}
            {taxByRate(7) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">USt 7%</span>
                <span>{taxByRate(7).toFixed(2)} €</span>
              </div>
            )}
            {taxByRate(19) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">USt 19%</span>
                <span>{taxByRate(19).toFixed(2)} €</span>
              </div>
            )}
            {mealTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verpflegung</span>
                <span>{mealTotal.toFixed(2)} €</span>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-semibold pt-2">
              <span>Brutto gesamt</span>
              <span>{total.toFixed(2)} €</span>
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
