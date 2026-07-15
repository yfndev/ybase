"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { getBankDetailsError } from "@/lib/bank-utils";
import { create } from "@/lib/server/volunteerAllowance/actions";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "@/lib/volunteerAllowance/constants";
import { CURRENT_YEAR } from "./constants";
import type { BankDetails, VolunteerAllowanceForm } from "./types";

const parseAmount = (value: string) => parseFloat(value.replace(",", "."));

export function useVolunteerAllowanceForm(defaultBankDetails: BankDetails) {
  const router = useRouter();
  const { data: session } = useSession();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<VolunteerAllowanceForm>({
    name: session?.user?.name || "",
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

  const update = (field: Partial<VolunteerAllowanceForm>) =>
    setForm((prev) => ({ ...prev, ...field }));

  const updateAmount = (value: string) => {
    if (parseAmount(value) > MAX_VOLUNTEER_ALLOWANCE_EUR) return;
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
    if (form.startDate > form.endDate)
      return "Das Enddatum liegt vor dem Startdatum";
    if (!form.taxYear) return "Bitte das Steuerjahr angeben";
    const amount = parseAmount(form.amount);
    if (!amount || amount <= 0) return "Bitte einen Betrag eingeben";
    if (amount > MAX_VOLUNTEER_ALLOWANCE_EUR)
      return `Maximal ${MAX_VOLUNTEER_ALLOWANCE_EUR} € erlaubt`;
    const bankDetailsError = getBankDetailsError(bank);
    if (bankDetailsError) return bankDetailsError;
    if (!form.confirmed) return "Bitte die Bestätigung ankreuzen";
    if (!signature) return "Bitte unterschreiben";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) return toast.error(error);
    if (!projectId || !signature) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await create({
        projectId,
        amount: parseAmount(form.amount),
        ...bank,
        activityDescription: form.activity,
        startDate: form.startDate,
        endDate: form.endDate,
        taxYear: form.taxYear,
        volunteerName: form.name,
        volunteerStreet: form.street,
        volunteerPlz: form.plz,
        volunteerCity: form.city,
        signatureStorageId: signature,
      });
      toast.success("Ehrenamtspauschale eingereicht");
      router.push("/reimbursements");
    } catch {
      toast.error("Fehler beim Einreichen");
      setIsSubmitting(false);
    }
  };

  return {
    projectId,
    setProjectId,
    bank,
    setBank,
    signature,
    setSignature,
    form,
    update,
    updateAmount,
    isSubmitting,
    handleSubmit,
  };
}
