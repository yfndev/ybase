import type { ReimbursementStatus } from "./reimbursementStatus";

export type DashboardEntry = {
  id: string;
  status: ReimbursementStatus;
  amount: number;
  projectName: string;
  creationTime: number;
  kind: "reimbursement" | "allowance";
  label: string;
  taxYear?: string;
};

export type StatusTotal = { count: number; sum: number };

export function statusTotals(
  entries: DashboardEntry[],
): Record<ReimbursementStatus, StatusTotal> {
  const totals: Record<ReimbursementStatus, StatusTotal> = {
    pending: { count: 0, sum: 0 },
    changes_requested: { count: 0, sum: 0 },
    approved: { count: 0, sum: 0 },
    paid: { count: 0, sum: 0 },
    declined: { count: 0, sum: 0 },
  };
  for (const entry of entries) {
    const total = totals[entry.status];
    total.count += 1;
    total.sum += entry.amount;
  }
  return totals;
}

export function sumByProject(entries: DashboardEntry[]) {
  const byProject = new Map<string, StatusTotal>();
  for (const entry of entries) {
    if (entry.status !== "approved" && entry.status !== "paid") continue;
    const stats = byProject.get(entry.projectName) ?? { count: 0, sum: 0 };
    stats.count += 1;
    stats.sum += entry.amount;
    byProject.set(entry.projectName, stats);
  }
  return [...byProject.entries()]
    .map(([projectName, stats]) => ({ projectName, ...stats }))
    .sort((first, second) => second.sum - first.sum);
}

const NO_TAX_YEAR = "Ohne Steuerjahr";

export function allowanceByTaxYear(entries: DashboardEntry[]) {
  const byYear = new Map<string, StatusTotal>();
  for (const entry of entries) {
    if (
      entry.kind !== "allowance" ||
      (entry.status !== "approved" && entry.status !== "paid")
    )
      continue;
    const taxYear = entry.taxYear || NO_TAX_YEAR;
    const stats = byYear.get(taxYear) ?? { count: 0, sum: 0 };
    stats.count += 1;
    stats.sum += entry.amount;
    byYear.set(taxYear, stats);
  }
  return [...byYear.entries()]
    .map(([taxYear, stats]) => ({ taxYear, ...stats }))
    .sort((first, second) => {
      if (first.taxYear === NO_TAX_YEAR) return 1;
      if (second.taxYear === NO_TAX_YEAR) return -1;
      return second.taxYear.localeCompare(first.taxYear);
    });
}

export function recentActivity(entries: DashboardEntry[], limit = 5) {
  return [...entries]
    .sort((first, second) => second.creationTime - first.creationTime)
    .slice(0, limit);
}
