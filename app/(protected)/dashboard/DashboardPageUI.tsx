"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  allowanceByTaxYear,
  type DashboardEntry,
  recentActivity,
  statusTotals,
  sumByProject,
} from "@/lib/dashboardStats";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { STATUS_DISPLAY } from "@/lib/reimbursementStatus";

const STATUS_CARDS = [
  { status: "pending", title: "Offen" },
  { status: "approved", title: "Genehmigt" },
  { status: "declined", title: "Abgelehnt" },
] as const;

type BreakdownRow = { key: string; label: string; count: number; sum: number };

function StatusDot({ status }: { status: DashboardEntry["status"] }) {
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DISPLAY[status].dot}`}
    />
  );
}

function BreakdownCard({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: BreakdownRow[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
            >
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {row.count} · {formatCurrency(row.sum)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPageUI({ entries }: { entries: DashboardEntry[] }) {
  const totals = statusTotals(entries);
  const projectRows: BreakdownRow[] = sumByProject(entries).map((row) => ({
    key: row.projectName,
    label: row.projectName,
    count: row.count,
    sum: row.sum,
  }));
  const taxYearRows: BreakdownRow[] = allowanceByTaxYear(entries).map(
    (row) => ({
      key: row.taxYear,
      label: row.taxYear,
      count: row.count,
      sum: row.sum,
    }),
  );
  const recent = recentActivity(entries);

  return (
    <div className="flex w-full flex-col">
      <PageHeader title="Dashboard" />

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {STATUS_CARDS.map((card) => (
            <Card key={card.status}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <StatusDot status={card.status} />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatCurrency(totals[card.status].sum)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {totals[card.status].count}{" "}
                  {totals[card.status].count === 1 ? "Antrag" : "Anträge"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BreakdownCard
            title="Summe pro Projekt"
            rows={projectRows}
            emptyText="Noch keine genehmigten Anträge."
          />
          <BreakdownCard
            title="Ehrenamt pro Steuerjahr"
            rows={taxYearRows}
            emptyText="Noch keine genehmigten Ehrenamtspauschalen."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Aktivität</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Anträge.
              </p>
            ) : (
              recent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusDot status={item.status} />
                    <span className="truncate">{item.projectName}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.creationTime)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
