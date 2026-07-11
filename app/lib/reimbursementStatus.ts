export type ReimbursementStatus = "pending" | "approved" | "declined";

export const STATUS_DISPLAY: Record<
  ReimbursementStatus,
  {
    variant: "default" | "destructive";
    label: string;
    dot: string;
    className: string;
  }
> = {
  pending: {
    variant: "default",
    label: "Ausstehend",
    dot: "bg-yellow-500",
    className: "",
  },
  approved: {
    variant: "default",
    label: "Genehmigt",
    dot: "bg-green-500",
    className: "bg-green-600 text-white border-green-600",
  },
  declined: {
    variant: "destructive",
    label: "Abgelehnt",
    dot: "bg-red-500",
    className: "",
  },
};
