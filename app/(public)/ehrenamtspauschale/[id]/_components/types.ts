import type { AllowanceLink } from "@/(public)/_lib/allowances";

export type AllowanceForm = {
  volunteerName: string;
  submitterEmail: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
  amount: string;
  iban: string;
  bic: string;
  accountHolder: string;
  taxYear: string;
  confirmation: boolean;
};

export type UpdateField = (
  field: keyof AllowanceForm,
  value: string | boolean,
) => void;

export type ValidAllowanceLink = Extract<AllowanceLink, { valid: true }>;
