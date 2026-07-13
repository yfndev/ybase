import type { Project } from "@/lib/db/types";

export type LinkType = "expense" | "travel" | "allowance";
export type LinkKind = "reimbursement" | "allowance";

export type PendingLink = {
  _id: string;
  projectName: string;
  linkType: LinkKind;
  type?: "expense" | "travel";
};

export type FormState = {
  projectId: string | null;
  description: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  allowFoodAllowance: boolean;
  invitedName: string;
  invitedEmail: string;
};

export type ShareModalUIProps = {
  open: boolean;
  onClose: () => void;
  type: LinkType;
  form: FormState;
  projects: Project[];
  isGenerating: boolean;
  needsDates: boolean;
  allLinks: PendingLink[];
  copiedId: string | null;
  onTypeChange: (type: LinkType) => void;
  onFormUpdate: (updates: Partial<FormState>) => void;
  onCopy: () => void;
  onSend: () => void;
  onCopyExistingLink: (id: string, linkType: LinkKind) => void;
  onDeleteLink: (id: string, linkType: LinkKind) => void;
};
