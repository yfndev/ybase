import toast from "react-hot-toast";
import { submitReimbursement } from "@/(public)/_lib/reimbursements";
import { BIC_REGEX, IBAN_REGEX, normalizeIban } from "@/lib/bank-utils";
import { getTravelDateRangeError } from "@/lib/travelDates";
import type { Receipt, TravelReceipt } from "./types";

type SubmitParams = {
  id: string;
  isTravel: boolean;
  totalGross: number;
  mealTotal: number;
  name: string;
  email: string;
  iban: string;
  bic: string;
  accountHolder: string;
  confirmation: boolean;
  signature: string | null;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  isInternational: boolean;
  mealDays: number;
  mealRate: number;
  receipts: Receipt[];
  travelReceipts: TravelReceipt[];
};

function withFileStorageId<T extends { fileStorageId: string | null }>(
  items: T[],
) {
  return items.filter(
    (item): item is T & { fileStorageId: string } =>
      typeof item.fileStorageId === "string",
  );
}

export function validateReimbursement(params: SubmitParams) {
  if (
    !params.name ||
    !params.email ||
    !params.iban ||
    !params.accountHolder ||
    !params.confirmation ||
    !params.signature
  ) {
    return "Bitte alle Pflichtfelder ausfüllen";
  }

  if (!/^\S+@\S+\.\S+$/.test(params.email)) {
    return "Bitte eine gültige E-Mail-Adresse eingeben";
  }

  if (params.isTravel) {
    if (
      !params.destination ||
      !params.purpose ||
      !params.startDate ||
      !params.endDate
    ) {
      return "Bitte alle Reiseangaben ausfüllen";
    }
    const dateRangeError = getTravelDateRangeError(
      params.startDate,
      params.endDate,
    );
    if (dateRangeError) return dateRangeError;
    if (params.travelReceipts.length === 0 && params.mealTotal === 0) {
      return "Bitte mindestens eine Kostenart oder Verpflegung hinzufügen";
    }
  } else if (params.receipts.length === 0) {
    return "Bitte mindestens einen Beleg hinzufügen";
  }

  if (!IBAN_REGEX.test(normalizeIban(params.iban))) {
    return "Ungültige IBAN";
  }

  if (params.bic && !BIC_REGEX.test(params.bic.toUpperCase())) {
    return "Ungültige BIC";
  }

  return null;
}

export async function submitReimbursementForm(params: SubmitParams) {
  if (!params.signature) {
    toast.error("Bitte unterschreiben");
    return false;
  }

  const validReceipts = withFileStorageId(
    params.receipts.filter((receipt) => receipt.fileStorageId),
  );

  const validTravelReceipts = withFileStorageId(
    params.travelReceipts.filter(
      (receipt) => receipt.fileStorageId && receipt.grossAmount > 0,
    ),
  );

  try {
    await submitReimbursement(params.id, {
      amount: params.totalGross,
      iban: normalizeIban(params.iban),
      bic: params.bic.toUpperCase(),
      accountHolder: params.accountHolder,
      submitterName: params.name,
      submitterEmail: params.email,
      signatureStorageId: params.signature,
      receipts: validReceipts,
      travelReceipts: params.isTravel ? validTravelReceipts : undefined,
      travelDetails: params.isTravel
        ? {
            startDate: params.startDate,
            endDate: params.endDate,
            destination: params.destination,
            purpose: params.purpose,
            isInternational: params.isInternational,
            mealAllowanceDays: params.mealDays || undefined,
            mealAllowanceDailyBudget: params.mealRate || undefined,
          }
        : undefined,
    });
    return true;
  } catch (caught) {
    toast.error(
      caught instanceof Error ? caught.message : "Fehler beim Einreichen",
    );
    return false;
  }
}
