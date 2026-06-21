import { ReceiptUploadExternal } from "@/components/Reimbursements/ReceiptUploadExternal";
import { SignatureCanvas } from "@/components/Reimbursements/SignatureCanvas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2, Plus, Smartphone, Trash2 } from "lucide-react";

type CostType = "car" | "train" | "flight" | "taxi" | "bus" | "accommodation";

type Receipt = {
  receiptNumber: string | undefined;
  receiptDate: string;
  companyName: string;
  description: string;
  netAmount: number;
  taxRate: number;
  grossAmount: number;
  fileStorageId: Id<"_storage"> | null;
};

type TravelReceipt = Receipt & {
  costType: CostType;
  kilometers?: number;
};

type Props = {
  isTravel: boolean;
  organizationName: string;
  projectName: string;
  allowFoodAllowance: boolean;
  showFoodAllowance: boolean;
  onShowFoodAllowanceChange: (value: boolean) => void;

  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;

  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  isInternational: boolean;
  mealDays: number;
  mealRate: number;
  mealTotal: number;
  onDestinationChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onIsInternationalChange: (value: boolean) => void;
  onMealDaysChange: (value: number) => void;
  onMealRateChange: (value: number) => void;

  company: string;
  number: string;
  description: string;
  date: string;
  gross: number;
  taxRate: number;
  currency: string;
  file: Id<"_storage"> | null;
  onCompanyChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onGrossChange: (value: number) => void;
  onTaxRateChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
  onFileChange: (value: Id<"_storage"> | null) => void;

  receipts: Receipt[];
  travelReceipts: TravelReceipt[];
  onAddReceipt: () => void;
  onRemoveReceipt: (index: number) => void;
  onToggleCostType: (costType: CostType) => void;
  onUpdateTravelReceipt: (costType: CostType, updates: Partial<TravelReceipt>) => void;

  totalGross: number;

  accountHolder: string;
  iban: string;
  bic: string;
  onAccountHolderChange: (value: string) => void;
  onIbanChange: (value: string) => void;
  onBicChange: (value: string) => void;

  confirmation: boolean;
  signature: Id<"_storage"> | null;
  onConfirmationChange: (value: boolean) => void;
  onSignatureChange: (value: Id<"_storage">) => void;

  isSubmitting: boolean;
  onSubmit: () => void;
  onMobileSign: () => void;

  reimbursementId: Id<"reimbursements">;
  generateUploadUrl: () => Promise<string>;
  getFileUrl: (storageId: Id<"_storage">) => Promise<string | null>;

  toNet: (gross: number, tax: number) => number;
  formatIban: (iban: string) => string;
  costLabels: Record<CostType, string>;
};

export default function ExternalReimbursementPageUI(props: Props) {
  return (
    <div className="min-h-svh py-8">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {props.isTravel ? "Reisekostenerstattung" : "Auslagenerstattung"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {props.organizationName} - {props.projectName}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Deine Angaben</h2>
          <div className="grid gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={props.name}
                onChange={(e) => props.onNameChange(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div>
              <Label>E-Mail (optional)</Label>
              <Input
                type="email"
                value={props.email}
                onChange={(e) => props.onEmailChange(e.target.value)}
                placeholder="deine@email.de"
              />
            </div>
          </div>
        </div>

        {props.isTravel ? (
          <>
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Reiseangaben</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reiseziel *</Label>
                  <Input
                    value={props.destination}
                    onChange={(e) => props.onDestinationChange(e.target.value)}
                    placeholder="z.B. München"
                  />
                </div>
                <div>
                  <Label>Reisezweck *</Label>
                  <Input
                    value={props.purpose}
                    onChange={(e) => props.onPurposeChange(e.target.value)}
                    placeholder="z.B. Konferenz"
                  />
                </div>
                <div>
                  <Label>Von *</Label>
                  <Input
                    type="date"
                    value={props.startDate}
                    onChange={(e) => props.onStartDateChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bis *</Label>
                  <Input
                    type="date"
                    value={props.endDate}
                    onChange={(e) => props.onEndDateChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="international"
                  checked={props.isInternational}
                  onCheckedChange={(checked) => props.onIsInternationalChange(checked === true)}
                />
                <Label htmlFor="international" className="font-normal">
                  Auslandsreise
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-medium">Kostenarten</h2>
              <p className="text-sm text-muted-foreground">
                Wähle alle Kostenarten aus, für die du Belege einreichen möchtest.
              </p>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(props.costLabels) as CostType[]).map((costType) => (
                  <Button
                    key={costType}
                    type="button"
                    variant={props.travelReceipts.some((receipt) => receipt.costType === costType) ? "default" : "outline"}
                    onClick={() => props.onToggleCostType(costType)}
                  >
                    {props.costLabels[costType]}
                  </Button>
                ))}
              </div>

              {props.travelReceipts.map((receipt) => {
                const isCar = receipt.costType === "car";

                return (
                  <div key={receipt.costType} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">
                        {isCar ? "PKW (0,30€/km)" : props.costLabels[receipt.costType]}
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => props.onToggleCostType(receipt.costType)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Firma/Anbieter *</Label>
                        <Input
                          value={receipt.companyName}
                          onChange={(e) => props.onUpdateTravelReceipt(receipt.costType, { companyName: e.target.value })}
                          placeholder="z.B. Deutsche Bahn"
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
                                const kilometers = Math.max(0, Math.floor(parseFloat(e.target.value) || 0));
                                const amount = Math.round(kilometers * 0.3 * 100) / 100;
                                props.onUpdateTravelReceipt(receipt.costType, {
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
                                props.onUpdateTravelReceipt(receipt.costType, {
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
                                const tax = parseInt(value);
                                props.onUpdateTravelReceipt(receipt.costType, {
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
                      <div>
                        <Label>Beleg *</Label>
                        <ReceiptUploadExternal
                          onUploadComplete={(storageId) =>
                            props.onUpdateTravelReceipt(receipt.costType, { fileStorageId: storageId })
                          }
                          storageId={receipt.fileStorageId || undefined}
                          generateUploadUrl={props.generateUploadUrl}
                          getFileUrl={props.getFileUrl}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {props.allowFoodAllowance && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="showFood"
                    checked={props.showFoodAllowance}
                    onCheckedChange={(checked) => props.onShowFoodAllowanceChange(checked === true)}
                  />
                  <Label htmlFor="showFood" className="text-lg font-medium cursor-pointer">
                    Verpflegungsmehraufwand geltend machen
                  </Label>
                </div>
              </div>
            )}

            {props.allowFoodAllowance && props.showFoodAllowance && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Verpflegungsmehraufwand</h2>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Tage</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        value={props.mealDays || ""}
                        onChange={(e) => props.onMealDaysChange(parseFloat(e.target.value) || 0)}
                        placeholder="z.B. 2.5"
                      />
                    </div>
                    <div>
                      <Label>Tagessatz (€)</Label>
                      <Select
                        value={props.mealRate ? String(props.mealRate) : ""}
                        onValueChange={(value) => props.onMealRateChange(parseFloat(value) || 0)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">14 € (8-24h)</SelectItem>
                          <SelectItem value="28">28 € (24h+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Betrag</Label>
                      <Input
                        value={`${props.mealTotal.toFixed(2)} €`}
                        disabled
                        className="bg-muted/50 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Belege</h2>
            <p className="text-sm text-muted-foreground">Füge alle Belege hinzu, die du einreichen möchtest.</p>

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
                  <Input type="date" value={props.date} onChange={(e) => props.onDateChange(e.target.value)} />
                </div>
                <div>
                  <Label>Brutto *</Label>
                  <div className="flex gap-1">
                    <Select value={props.currency} onValueChange={props.onCurrencyChange}>
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
                      onChange={(e) => props.onGrossChange(parseFloat(e.target.value) || 0)}
                      placeholder="119.95"
                    />
                  </div>
                </div>
                <div>
                  <Label>MwSt.</Label>
                  <Select value={String(props.taxRate)} onValueChange={(value) => props.onTaxRateChange(parseInt(value))}>
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
                    value={props.gross ? props.toNet(props.gross, props.taxRate).toFixed(2) : ""}
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

              <Button onClick={props.onAddReceipt} variant="outline" className="w-full">
                <Plus className="size-5 mr-2" />
                {props.receipts.length === 0
                  ? "Beleg hinzufügen"
                  : "Weiteren Beleg hinzufügen"}
              </Button>
            </div>

            {props.receipts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Hinzugefügte Belege</h3>
                {props.receipts.map((receipt, index) => (
                  <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-md">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{receipt.companyName}</span>
                      <span className="text-sm text-muted-foreground">
                        {receipt.description || "Keine Beschreibung"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{receipt.grossAmount.toFixed(2)} €</span>
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
            )}
          </div>
        )}

        {props.totalGross > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between text-lg font-semibold">
              <span>Gesamtbetrag</span>
              <span>{props.totalGross.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Bankverbindung</h2>
          <div className="grid gap-4">
            <div>
              <Label>Kontoinhaber *</Label>
              <Input
                value={props.accountHolder}
                onChange={(e) => props.onAccountHolderChange(e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <Label>IBAN *</Label>
              <Input
                value={props.formatIban(props.iban)}
                onChange={(e) => props.onIbanChange(e.target.value.replace(/\s/g, ""))}
                placeholder="DE89 3704 0044 0532 0130 00"
                className="font-mono"
                maxLength={27}
              />
            </div>
            <div>
              <Label>BIC (optional)</Label>
              <Input
                value={props.bic.toUpperCase()}
                onChange={(e) => props.onBicChange(e.target.value.toUpperCase())}
                placeholder="COBADEFFXXX"
                className="font-mono"
                maxLength={11}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Bestätigung</h2>
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirmation"
              checked={props.confirmation}
              onCheckedChange={(checked) => props.onConfirmationChange(checked === true)}
            />
            <Label htmlFor="confirmation" className="text-sm leading-relaxed">
              Ich bestätige, dass alle Angaben korrekt sind und die eingereichten Belege tatsächlich entstandene Kosten
              darstellen.
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Unterschrift</h2>
          {!props.signature ? (
            <div className="space-y-4">
              <SignatureCanvas
                onUploadComplete={props.onSignatureChange}
                storageId={props.signature || undefined}
                generateUploadUrl={props.generateUploadUrl}
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Oder</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={props.onMobileSign}>
                <Smartphone className="size-4 mr-2" />
                Auf Handy unterschreiben
              </Button>
            </div>
          ) : (
            <SignatureCanvas
              onUploadComplete={props.onSignatureChange}
              storageId={props.signature || undefined}
              generateUploadUrl={props.generateUploadUrl}
            />
          )}
        </div>

        <Button onClick={props.onSubmit} className="w-full h-14 font-semibold" size="lg" disabled={props.isSubmitting}>
          {props.isSubmitting && <Loader2 className="size-5 animate-spin mr-2" />}
          Einreichen
        </Button>
      </div>
    </div>
  );
}
