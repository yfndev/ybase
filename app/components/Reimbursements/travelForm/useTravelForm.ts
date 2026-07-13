"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createTravelReimbursement } from "@/lib/server/reimbursements/actions";
import { getBankDetailsError } from "@/lib/bank-utils";
import { type CostType, DEFAULT_TAX_RATES } from "@/lib/travel-costs";
import { getTravelDateRangeError } from "@/lib/travelDates";
import type { BankDetails, Receipt } from "./types";

export function useTravelForm(defaultBankDetails: BankDetails) {
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [signature, setSignature] = useState<string | null>(null);
  const [showMealAllowance, setShowMealAllowance] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        receipts.filter((receipt) => receipt.costType !== type),
      );
    }
    setReceipts([
      ...receipts,
      {
        costType: type,
        receiptNumber: undefined,
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
        receipt.costType === type ? { ...receipt, ...updates } : receipt,
      ),
    );

  const hasBasicInfo =
    travel.destination &&
    travel.purpose &&
    travel.startDate &&
    travel.endDate &&
    !getTravelDateRangeError(travel.startDate, travel.endDate);
  const mealTotal = travel.mealDays * travel.mealRate;
  const totalNet = receipts.reduce(
    (sum, receipt) => sum + receipt.netAmount,
    0,
  );
  const totalGross = receipts.reduce(
    (sum, receipt) => sum + receipt.grossAmount,
    0,
  );
  const total = totalGross + mealTotal;
  const taxByRate = (rate: number) =>
    receipts
      .filter((receipt) => receipt.taxRate === rate)
      .reduce(
        (sum, receipt) => sum + receipt.grossAmount - receipt.netAmount,
        0,
      );
  const allComplete = receipts.every(
    (receipt) =>
      receipt.grossAmount > 0 && receipt.fileStorageId && receipt.companyName,
  );
  const canSubmit =
    hasBasicInfo &&
    (receipts.length > 0 || mealTotal > 0) &&
    (receipts.length === 0 || allComplete) &&
    projectId;

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Bitte ein Projekt auswählen");
    const bankDetailsError = getBankDetailsError(bank);
    if (bankDetailsError) return toast.error(bankDetailsError);
    if (!signature) return toast.error("Bitte unterschreiben");
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    showMealAllowance,
    setShowMealAllowance,
    receipts,
    travel,
    update,
    hasReceipt,
    toggleType,
    updateReceipt,
    hasBasicInfo,
    mealTotal,
    totalNet,
    total,
    taxByRate,
    canSubmit,
    isSubmitting,
    handleSubmit,
  };
}
