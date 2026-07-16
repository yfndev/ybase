"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { getBankDetailsError } from "@/lib/bank-utils";
import { createTravelReimbursement } from "@/lib/server/reimbursements/creation";
import {
  type CostType,
  createMealAllowance,
  DEFAULT_TAX_RATES,
  getMealAllowanceTotal,
  OVERNIGHT_ALLOWANCE_EUR,
} from "@/lib/travel-costs";
import {
  createClientReceiptId,
  withoutClientReceiptId,
} from "@/lib/travelReceiptForm";
import { getTravelDateRangeError } from "@/lib/travelDates";
import type { BankDetails, Receipt } from "./types";

export function useTravelForm(defaultBankDetails: BankDetails) {
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [signature, setSignature] = useState<string | null>(null);
  const [showMealAllowance, setShowMealAllowance] = useState(false);
  const [showOvernightAllowance, setShowOvernightAllowance] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [travel, setTravel] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isInternational: false,
    mealAllowance: createMealAllowance(),
    overnightAllowanceNights: 0,
    overnightAllowanceRate: OVERNIGHT_ALLOWANCE_EUR,
  });

  const update = (field: Partial<typeof travel>) =>
    setTravel((prev) => ({ ...prev, ...field }));

  const addReceipt = (type: CostType) => {
    setReceipts((current) => [
      ...current,
      {
        clientId: createClientReceiptId(),
        costType: type,
        receiptNumber: undefined,
        receiptDate: travel.startDate,
        companyName: type === "car" ? "Privater PKW" : "",
        description: "",
        netAmount: 0,
        taxRate: DEFAULT_TAX_RATES[type],
        grossAmount: 0,
        fileStorageId: "",
        kilometers: type === "car" ? 0 : undefined,
      },
    ]);
  };

  const removeReceipt = (clientId: string) =>
    setReceipts((current) =>
      current.filter((receipt) => receipt.clientId !== clientId),
    );

  const updateReceipt = (clientId: string, updates: Partial<Receipt>) =>
    setReceipts((current) =>
      current.map((receipt) =>
        receipt.clientId === clientId ? { ...receipt, ...updates } : receipt,
      ),
    );

  const hasBasicInfo =
    travel.destination &&
    travel.purpose &&
    travel.startDate &&
    travel.startTime &&
    travel.endDate &&
    travel.endTime &&
    !getTravelDateRangeError(
      travel.startDate,
      travel.endDate,
      travel.startTime,
      travel.endTime,
    );
  const mealTotal = getMealAllowanceTotal(travel.mealAllowance);
  const overnightTotal =
    travel.overnightAllowanceNights * travel.overnightAllowanceRate;
  const totalNet = receipts.reduce(
    (sum, receipt) => sum + receipt.netAmount,
    0,
  );
  const totalGross = receipts.reduce(
    (sum, receipt) => sum + receipt.grossAmount,
    0,
  );
  const total = totalGross + mealTotal + overnightTotal;
  const taxByRate = (rate: number) =>
    receipts
      .filter((receipt) => receipt.taxRate === rate)
      .reduce(
        (sum, receipt) => sum + receipt.grossAmount - receipt.netAmount,
        0,
      );
  const allComplete = receipts.every(
    (receipt) =>
      receipt.grossAmount > 0 &&
      (receipt.costType === "car"
        ? Boolean(receipt.kilometers)
        : Boolean(receipt.fileStorageId && receipt.companyName)),
  );
  const canSubmit =
    hasBasicInfo &&
    (receipts.length > 0 || mealTotal > 0 || overnightTotal > 0) &&
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
        startTime: travel.startTime,
        endDate: travel.endDate,
        endTime: travel.endTime,
        destination: travel.destination,
        purpose: travel.purpose,
        isInternational: travel.isInternational,
        mealAllowance: mealTotal > 0 ? travel.mealAllowance : undefined,
        overnightAllowanceNights: travel.overnightAllowanceNights || undefined,
        overnightAllowanceRate:
          travel.overnightAllowanceNights > 0
            ? travel.overnightAllowanceRate
            : undefined,
        receipts: receipts.map(withoutClientReceiptId),
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
    showOvernightAllowance,
    setShowOvernightAllowance,
    receipts,
    travel,
    update,
    addReceipt,
    removeReceipt,
    updateReceipt,
    hasBasicInfo,
    mealTotal,
    overnightTotal,
    totalNet,
    total,
    taxByRate,
    canSubmit,
    isSubmitting,
    handleSubmit,
  };
}
