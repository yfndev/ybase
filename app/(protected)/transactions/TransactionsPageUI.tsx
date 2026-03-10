"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { editableColumns } from "@/components/Tables/Transactions/EditableColumns";
import { EditableDataTable } from "@/components/Tables/Transactions/EditableDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/formatters/formatDate";
import type { EnrichedTransaction } from "@/lib/transactionFilters";
import type { PaginationStatus } from "convex/react";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

type StatusFilter = "all" | "processed" | "expected" | "budget";

interface Props {
  selectedDateRange: DateRange | null;
  transactions: EnrichedTransaction[];
  status: PaginationStatus;
  loadMore: () => void;
  onUpdateTransaction: (
    rowId: string,
    field: string,
    value: unknown
  ) => Promise<void>;
  onDeleteTransaction: (rowId: string) => Promise<void>;
}

function exportCsv(transactions: EnrichedTransaction[]) {
  const headers = ["Datum", "Gegenseite", "Beschreibung", "Projekt", "Kategorie", "Betrag (€)", "Status"];
  const rows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("de-DE"),
    t.counterparty,
    t.description,
    t.projectName ?? "",
    t.categoryName ?? "",
    t.amount.toFixed(2),
    t.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Transaktionen_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function filterByStatus(
  transactions: EnrichedTransaction[],
  filter: StatusFilter
) {
  if (filter === "all") return transactions;
  if (filter === "budget") return transactions.filter((t) => t.transferId);
  if (filter === "processed")
    return transactions.filter(
      (t) => t.status === "processed" && !t.transferId
    );
  return transactions.filter((t) => t.status === "expected");
}

function filterBySearch(transactions: EnrichedTransaction[], search: string) {
  if (!search) return transactions;

  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);

  return transactions.filter((t) => {
    const text = [t.counterparty, t.description, t.projectName, t.categoryName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function TransactionsPageUI({
  selectedDateRange,
  transactions,
  status,
  loadMore,
  onUpdateTransaction,
  onDeleteTransaction,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const byStatus = filterByStatus(transactions, statusFilter);
    return filterBySearch(byStatus, search);
  }, [transactions, statusFilter, search]);

  const dateRangeText = selectedDateRange
    ? `${formatDate(selectedDateRange.from)} - ${formatDate(selectedDateRange.to)}`
    : "Keinen Zeitraum ausgewählt";

  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Transaktionen" showRangeCalendar />
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <div className="text-sm text-muted-foreground">{dateRangeText}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(filteredTransactions)}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="expected">Geplant</TabsTrigger>
            <TabsTrigger value="processed">Abgerechnet</TabsTrigger>
            <TabsTrigger value="budget">Budgets</TabsTrigger>
          </TabsList>
          </Tabs>
        </div>
      </div>
      <div id="tour-transactions-table">
        <EditableDataTable
          columns={editableColumns}
          data={filteredTransactions}
          onUpdate={onUpdateTransaction}
          onDelete={onDeleteTransaction}
          paginationStatus={status}
          loadMore={loadMore}
        />
      </div>
    </div>
  );
}
