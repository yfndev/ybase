import type { Project } from "@/lib/db/types";

export type BankDetails = { iban: string; bic: string; accountHolder: string };

export type VolunteerAllowanceForm = {
  name: string;
  street: string;
  plz: string;
  city: string;
  activity: string;
  startDate: string;
  endDate: string;
  amount: string;
  taxYear: string;
  confirmed: boolean;
};

export interface Props {
  defaultBankDetails: BankDetails;
  projects: Project[];
}
