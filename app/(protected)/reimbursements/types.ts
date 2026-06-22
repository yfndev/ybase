import type {
  Reimbursement as ReimbursementDoc,
  TravelDetails,
  VolunteerAllowance,
} from "@/lib/db/types";

export type Reimbursement = ReimbursementDoc & {
  creatorName: string;
  projectName: string;
  travelDetails?: TravelDetails;
  reviewedByName?: string;
};

export type Allowance = VolunteerAllowance & {
  creatorName: string;
  projectName: string;
  organizationName: string;
  organizationStreet: string;
  organizationPlz: string;
  organizationCity: string;
  reviewedByName?: string;
};

export type SelectionKey = `r:${string}` | `a:${string}`;

export type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: string | null;
  note: string;
};
