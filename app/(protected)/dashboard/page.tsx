import { auth } from "@/lib/auth";
import type { DashboardEntry } from "@/lib/dashboardStats";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import { DashboardPageUI } from "./DashboardPageUI";

const REIMBURSEMENT_LABEL = {
  expense: "Auslagen",
  travel: "Reisekosten",
} as const;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const [reimbursements, allowances] = await Promise.all([
    getAllReimbursements(),
    getAll(),
  ]);

  const entries: DashboardEntry[] = [
    ...reimbursements.map((item) => ({
      id: item._id,
      status: item.status,
      amount: item.amount,
      projectName: item.projectName,
      creationTime: item._creationTime,
      kind: "reimbursement" as const,
      label: REIMBURSEMENT_LABEL[item.type],
    })),
    ...allowances.map((item) => ({
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

  return <DashboardPageUI entries={entries} />;
}
