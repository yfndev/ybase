"use client";

import {
  submitAllowance,
  uploadViaPresign,
  validateAllowanceLink,
  type AllowanceLink,
} from "@/(public)/_lib/publicApi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "./constants";
import { validateAllowanceForm } from "./helpers";
import type { AllowanceForm } from "./types";

const initialForm: AllowanceForm = {
  volunteerName: "",
  volunteerStreet: "",
  volunteerPlz: "",
  volunteerCity: "",
  activityDescription: "",
  startDate: "",
  endDate: "",
  amount: "",
  iban: "",
  bic: "",
  accountHolder: "",
  taxYear: String(new Date().getFullYear()),
  confirmation: false,
};

export function useAllowanceForm(id: string) {
  const [linkData, setLinkData] = useState<AllowanceLink | null>(null);
  const [signatureStorageId, setSignatureStorageId] = useState<string | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<AllowanceForm>(initialForm);

  useEffect(() => {
    validateAllowanceLink(id).then(setLinkData);
  }, [id]);

  useEffect(() => {
    if (
      linkData?.valid &&
      !form.activityDescription &&
      linkData.activityDescription
    ) {
      setForm((prev) => ({
        ...prev,
        activityDescription: linkData.activityDescription || "",
        startDate: linkData.startDate || "",
        endDate: linkData.endDate || "",
      }));
    }
  }, [linkData, form.activityDescription]);

  const updateField = (field: keyof AllowanceForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAmount = (value: string) => {
    if (parseFloat(value.replace(",", ".")) > MAX_VOLUNTEER_ALLOWANCE_EUR)
      return;
    updateField("amount", value);
  };

  const uploadSignature = (blob: Blob) =>
    uploadViaPresign(
      `/api/public/allowance/${id}/upload-url`,
      { contentType: "image/png" },
      blob,
    );

  const handleSubmit = async () => {
    const result = validateAllowanceForm(form, signatureStorageId);
    if (!result.ok) return toast.error(result.error);

    setIsSubmitting(true);
    try {
      await submitAllowance(id, {
        amount: result.values.amount,
        iban: result.values.iban,
        bic: result.values.bic,
        accountHolder: form.accountHolder,
        activityDescription: form.activityDescription,
        startDate: form.startDate,
        endDate: form.endDate,
        volunteerName: form.volunteerName,
        volunteerStreet: form.volunteerStreet,
        volunteerPlz: form.volunteerPlz,
        volunteerCity: form.volunteerCity,
        taxYear: form.taxYear,
        signatureStorageId: signatureStorageId as string,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Einreichen",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    linkData,
    form,
    submitted,
    isSubmitting,
    signatureStorageId,
    setSignatureStorageId,
    updateField,
    updateAmount,
    uploadSignature,
    handleSubmit,
  };
}
