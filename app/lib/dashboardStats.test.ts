import { describe, expect, it } from "vitest";
import {
  allowanceByTaxYear,
  type DashboardEntry,
  recentActivity,
  statusTotals,
  sumByProject,
} from "./dashboardStats";

const entry = (over: Partial<DashboardEntry>): DashboardEntry => ({
  id: "id",
  status: "approved",
  amount: 100,
  projectName: "Event A",
  creationTime: 1000,
  kind: "reimbursement",
  label: "Auslagen",
  ...over,
});

describe("statusTotals", () => {
  it("counts and sums per status", () => {
    const totals = statusTotals([
      entry({ status: "pending", amount: 50 }),
      entry({ status: "pending", amount: 70 }),
      entry({ status: "approved", amount: 200 }),
      entry({ status: "paid", amount: 150 }),
      entry({ status: "declined", amount: 10 }),
      entry({ status: "changes_requested", amount: 20 }),
    ]);

    expect(totals.pending).toEqual({ count: 2, sum: 120 });
    expect(totals.approved).toEqual({ count: 1, sum: 200 });
    expect(totals.paid).toEqual({ count: 1, sum: 150 });
    expect(totals.declined).toEqual({ count: 1, sum: 10 });
    expect(totals.changes_requested).toEqual({ count: 1, sum: 20 });
  });

  it("returns zeroed totals for empty input", () => {
    const totals = statusTotals([]);
    expect(totals.pending).toEqual({ count: 0, sum: 0 });
    expect(totals.approved).toEqual({ count: 0, sum: 0 });
    expect(totals.paid).toEqual({ count: 0, sum: 0 });
    expect(totals.declined).toEqual({ count: 0, sum: 0 });
    expect(totals.changes_requested).toEqual({ count: 0, sum: 0 });
  });
});

describe("sumByProject", () => {
  it("groups approved entries by project and sorts by sum descending", () => {
    const result = sumByProject([
      entry({ projectName: "Event A", amount: 100 }),
      entry({ projectName: "Event A", amount: 50 }),
      entry({ projectName: "Event A", status: "paid", amount: 25 }),
      entry({ projectName: "Event B", amount: 300 }),
      entry({ projectName: "Event B", status: "pending", amount: 999 }),
    ]);

    expect(result).toEqual([
      { projectName: "Event B", count: 1, sum: 300 },
      { projectName: "Event A", count: 3, sum: 175 },
    ]);
  });
});

describe("allowanceByTaxYear", () => {
  it("only counts approved allowances and buckets missing tax year", () => {
    const result = allowanceByTaxYear([
      entry({ kind: "allowance", taxYear: "2024", amount: 200 }),
      entry({ kind: "allowance", taxYear: "2025", amount: 100 }),
      entry({ kind: "allowance", amount: 40 }),
      entry({
        kind: "allowance",
        taxYear: "2024",
        status: "paid",
        amount: 50,
      }),
      entry({
        kind: "allowance",
        taxYear: "2024",
        status: "pending",
        amount: 999,
      }),
      entry({ kind: "reimbursement", taxYear: "2024", amount: 999 }),
    ]);

    expect(result).toEqual([
      { taxYear: "2025", count: 1, sum: 100 },
      { taxYear: "2024", count: 2, sum: 250 },
      { taxYear: "Ohne Steuerjahr", count: 1, sum: 40 },
    ]);
  });
});

describe("recentActivity", () => {
  it("returns the most recent entries up to the limit", () => {
    const result = recentActivity(
      [
        entry({ creationTime: 1 }),
        entry({ creationTime: 3 }),
        entry({ creationTime: 2 }),
      ],
      2,
    );

    expect(result.map((item) => item.creationTime)).toEqual([3, 2]);
  });
});
