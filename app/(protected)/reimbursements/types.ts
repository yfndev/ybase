import type { Doc, Id } from "@/convex/_generated/dataModel";

export type Reimbursement = Doc<"reimbursements"> & {
  creatorName: string;
  projectName: string;
  travelDetails?: Doc<"travelDetails">;
  reviewedByName: string | undefined;
};

export type Allowance = Doc<"volunteerAllowance"> & {
  creatorName: string;
  projectName: string;
  organizationName: string;
  organizationStreet: string;
  organizationPlz: string;
  organizationCity: string;
  reviewedByName: string | undefined;
};

export type SelectionKey = `r:${string}` | `a:${string}`;

export type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: Id<"reimbursements"> | Id<"volunteerAllowance"> | null;
  note: string;
};
