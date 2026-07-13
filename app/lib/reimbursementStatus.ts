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
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  approved: {
    variant: "default",
    label: "Genehmigt",
    dot: "bg-green-500",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  declined: {
    variant: "default",
    label: "Abgelehnt",
    dot: "bg-red-500",
    className: "bg-red-50 border-red-200 text-red-800",
  },
};
