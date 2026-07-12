import {
  BIC_REGEX,
  IBAN_REGEX,
  MAX_VOLUNTEER_ALLOWANCE_EUR,
} from "./constants";
import type { AllowanceForm } from "./types";

export const formatIban = (iban: string) =>
  iban
    .replace(/\s/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

export type ValidatedAllowance = {
  amount: number;
  iban: string;
  bic?: string;
};

type ValidationResult =
  | { ok: true; values: ValidatedAllowance }
  | { ok: false; error: string };

export const validateAllowanceForm = (
  form: AllowanceForm,
  signatureStorageId: string | null,
): ValidationResult => {
  if (!form.volunteerName)
    return { ok: false, error: "Bitte deinen Namen eingeben" };
  if (!form.volunteerStreet)
    return { ok: false, error: "Bitte deine Straße eingeben" };
  if (!form.volunteerPlz)
    return { ok: false, error: "Bitte deine PLZ eingeben" };
  if (!form.volunteerCity)
    return { ok: false, error: "Bitte deinen Ort eingeben" };
  if (!form.activityDescription)
    return { ok: false, error: "Bitte die Tätigkeit beschreiben" };
  if (!form.startDate || !form.endDate)
    return { ok: false, error: "Bitte den Zeitraum angeben" };
  if (form.startDate > form.endDate)
    return { ok: false, error: "Das Enddatum liegt vor dem Startdatum" };
  if (!form.taxYear)
    return { ok: false, error: "Bitte das Steuerjahr angeben" };

  const amount = parseFloat(form.amount.replace(",", "."));
  if (!amount || amount <= 0)
    return { ok: false, error: "Bitte einen Betrag eingeben" };
  if (amount > MAX_VOLUNTEER_ALLOWANCE_EUR)
    return {
      ok: false,
      error: `Maximal ${MAX_VOLUNTEER_ALLOWANCE_EUR} € erlaubt`,
    };

  if (!form.accountHolder)
    return { ok: false, error: "Bitte den Kontoinhaber eingeben" };

  const iban = form.iban.replace(/\s/g, "").toUpperCase();
  if (!IBAN_REGEX.test(iban)) return { ok: false, error: "Ungültige IBAN" };

  const bic = form.bic.replace(/\s/g, "").toUpperCase();
  if (bic && !BIC_REGEX.test(bic)) return { ok: false, error: "Ungültige BIC" };

  if (!form.confirmation)
    return { ok: false, error: "Bitte die Bestätigung ankreuzen" };
  if (!signatureStorageId) return { ok: false, error: "Bitte unterschreiben" };

  return { ok: true, values: { amount, iban, bic: bic || undefined } };
};
