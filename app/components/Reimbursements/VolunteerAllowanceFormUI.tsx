"use client";

import { BankDetailsEditor } from "@/components/BankDetailsEditor";
import { SignatureField } from "@/components/Reimbursements/SignatureField";
import { AmountInput } from "@/components/Selectors/AmountInput";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "@/convex/volunteerAllowance/constants";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type BankDetails = { iban: string; bic: string; accountHolder: string };

const CURRENT_YEAR = new Date().getFullYear();
const TAX_YEARS = Array.from({ length: 3 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

interface Props {
  defaultBankDetails: BankDetails;
}

export function VolunteerAllowanceFormUI({ defaultBankDetails }: Props) {
  const router = useRouter();
  const currentUser = useQuery(api.users.queries.getCurrentUserProfile);
  const submit = useMutation(api.volunteerAllowance.functions.create);

  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [signature, setSignature] = useState<Id<"_storage"> | null>(null);

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    street: "",
    plz: "",
    city: "",
    activity: "",
    startDate: "",
    endDate: "",
    amount: "",
    taxYear: String(CURRENT_YEAR),
    confirmed: false,
  });

  const update = (field: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...field }));

  const updateAmount = (value: string) => {
    if (parseFloat(value.replace(",", ".")) > MAX_VOLUNTEER_ALLOWANCE_EUR) return;
    update({ amount: value });
  };

  const validate = () => {
    if (!projectId) return "Bitte ein Projekt auswählen";
    if (!form.name) return "Bitte deinen Namen eingeben";
    if (!form.street) return "Bitte deine Straße eingeben";
    if (!form.plz) return "Bitte deine PLZ eingeben";
    if (!form.city) return "Bitte deinen Ort eingeben";
    if (!form.activity) return "Bitte die Tätigkeit beschreiben";
    if (!form.startDate || !form.endDate) return "Bitte den Zeitraum angeben";
    if (!form.taxYear) return "Bitte das Steuerjahr angeben";
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!amount || amount <= 0) return "Bitte einen Betrag eingeben";
    if (amount > MAX_VOLUNTEER_ALLOWANCE_EUR) return `Maximal ${MAX_VOLUNTEER_ALLOWANCE_EUR}€ erlaubt`;
    if (!bank.accountHolder) return "Bitte den Kontoinhaber eingeben";
    if (!bank.iban) return "Bitte die IBAN eingeben";
    if (!form.confirmed) return "Bitte die Bestätigung ankreuzen";
    if (!signature) return "Bitte unterschreiben";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) return toast.error(error);

    await submit({
      projectId: projectId!,
      amount: parseFloat(form.amount.replace(",", ".")),
      ...bank,
      activityDescription: form.activity,
      startDate: form.startDate,
      endDate: form.endDate,
      taxYear: form.taxYear,
      volunteerName: form.name,
      volunteerStreet: form.street,
      volunteerPlz: form.plz,
      volunteerCity: form.city,
      signatureStorageId: signature!,
    });
    toast.success("Ehrenamtspauschale eingereicht");
    router.push("/reimbursements");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="w-[200px]">
        <Label>Projekt *</Label>
        <SelectProject
          value={projectId || ""}
          onValueChange={(value) =>
            setProjectId(value ? (value as Id<"projects">) : null)
          }
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Persönliche Daten</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Vor- und Nachname"
            />
          </div>
          <div className="col-span-2">
            <Label>Straße und Hausnummer *</Label>
            <Input
              value={form.street}
              onChange={(e) => update({ street: e.target.value })}
              placeholder="Musterstraße 123"
            />
          </div>
          <div>
            <Label>PLZ *</Label>
            <Input
              value={form.plz}
              onChange={(e) =>
                update({ plz: e.target.value.replace(/\D/g, "") })
              }
              placeholder="12345"
              inputMode="numeric"
              maxLength={5}
            />
          </div>
          <div>
            <Label>Ort *</Label>
            <Input
              value={form.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="Musterstadt"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tätigkeit</h2>
        <div>
          <Label>Beschreibung der nebenberuflichen Tätigkeit *</Label>
          <Textarea
            value={form.activity}
            onChange={(e) => update({ activity: e.target.value })}
            placeholder="z.B. Übungsleiter, Jugendarbeit, Vorstandstätigkeit"
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Von *</Label>
            <DateInput
              value={form.startDate}
              onChange={(value) => update({ startDate: value })}
            />
          </div>
          <div>
            <Label>Bis *</Label>
            <DateInput
              value={form.endDate}
              onChange={(value) => update({ endDate: value })}
            />
          </div>
          <div>
            <Label>Steuerjahr *</Label>
            <Select
              value={form.taxYear}
              onValueChange={(value) => update({ taxYear: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Betrag</h2>
        <div className="max-w-xs">
          <Label>Betrag in Euro (max. {MAX_VOLUNTEER_ALLOWANCE_EUR}€) *</Label>
          <AmountInput value={form.amount} onChange={updateAmount} />
        </div>
      </div>

      <BankDetailsEditor value={bank} onChange={setBank} />

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Bestätigung</h2>
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm"
            checked={form.confirmed}
            onCheckedChange={(checked) =>
              update({ confirmed: checked === true })
            }
          />
          <Label htmlFor="confirm" className="text-sm leading-relaxed">
            Ich erkläre, dass die Steuerbefreiung nach § 3 Nr. 26a EStG für
            nebenberufliche ehrenamtliche Tätigkeit in Höhe von{" "}
            {form.amount || "0,00"} Euro für das Jahr {form.taxYear} in Anspruch
            genommen werden kann. Sollte sich im Lauf des Jahres eine Änderung
            ergeben, informiere ich hierüber unverzüglich den Verein. Mir ist
            bekannt, dass andernfalls Nachteile des Vereins zu meinen Lasten
            gehen.
          </Label>
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
  );
}
