"use client";

import { api } from "@/convex/_generated/api";
import type { DashboardEntry } from "@/lib/dashboardStats";
import { useQuery } from "convex/react";
import { DashboardPageUI } from "./DashboardPageUI";

const REIMBURSEMENT_LABEL = {
  expense: "Auslagen",
  travel: "Reisekosten",
} as const;

export default function DashboardPage() {
  const reimbursements = useQuery(
    api.reimbursements.queries.getAllReimbursements,
  );
  const allowances = useQuery(api.volunteerAllowance.queries.getAll);

  const isLoading = !reimbursements || !allowances;

  const entries: DashboardEntry[] = [
    ...(reimbursements ?? []).map((item) => ({
      id: item._id,
      status: item.status,
      amount: item.amount,
      projectName: item.projectName,
      creationTime: item._creationTime,
      kind: "reimbursement" as const,
      label: REIMBURSEMENT_LABEL[item.type],
    })),
    ...(allowances ?? []).map((item) => ({
      id: item._id,
      status: item.status,
      amount: item.amount,
      projectName: item.projectName,
      creationTime: item._creationTime,
      kind: "allowance" as const,
      label: "Ehrenamtspauschale",
      taxYear: item.taxYear,
    })),
  ];

  return <DashboardPageUI isLoading={isLoading} entries={entries} />;
}
