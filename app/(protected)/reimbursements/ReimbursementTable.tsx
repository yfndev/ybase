"use client";

import { MoveHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReimbursementRow } from "../../components/Tables/Reimbursements/ReimbursementRow";
import { reimbursementColumnClassNames as columns } from "../../components/Tables/Reimbursements/reimbursementTableClasses";
import type { Allowance, Reimbursement, SelectionKey } from "./types";

type Props = {
  canManageReimbursements: boolean;
  currentUserId: string;
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  selected: Set<SelectionKey>;
  onRowClick: (id: string) => void;
  onApproveReimbursement: (id: string) => void;
  onApproveAllowance: (id: string) => void;
  onMarkReimbursementAsPaid: (id: string) => void;
  onMarkAllowanceAsPaid: (id: string) => void;
  onOpenChangesDialog: (
    type: "reimbursement" | "allowance",
    id: string,
  ) => void;
  onOpenRejectDialog: (type: "reimbursement" | "allowance", id: string) => void;
  onOpenReimbursement: (id: string) => void;
  onOpenAllowance: (allowance: Allowance) => void;
  onEditReimbursement: (id: string) => void;
  onEditAllowance: (id: string) => void;
  onDeleteReimbursement: (id: string) => void;
  onDeleteAllowance: (id: string) => void;
  onToggleSelect: (key: SelectionKey) => void;
  onToggleSelectAll: () => void;
};

export function ReimbursementTable({
  canManageReimbursements,
  currentUserId,
  reimbursements,
  allowances,
  selected,
  onRowClick,
  onApproveReimbursement,
  onApproveAllowance,
  onMarkReimbursementAsPaid,
  onMarkAllowanceAsPaid,
  onOpenChangesDialog,
  onOpenRejectDialog,
  onOpenReimbursement,
  onOpenAllowance,
  onEditReimbursement,
  onEditAllowance,
  onDeleteReimbursement,
  onDeleteAllowance,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const isEmpty = reimbursements.length === 0 && allowances.length === 0;
  const totalRows = reimbursements.length + allowances.length;
  const allSelected = totalRows > 0 && selected.size === totalRows;

  if (isEmpty) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine Erstattungen gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/reimbursement-table rounded-lg border bg-card">
      <span id="reimbursement-table-scroll-description" className="sr-only">
        Die Tabelle kann bei sehr schmalen Bildschirmen horizontal gescrollt
        werden.
      </span>
      <Table
        aria-label="Erstattungen"
        aria-describedby="reimbursement-table-scroll-description"
        containerClassName="overflow-x-scroll [overscroll-behavior-inline:contain] [scrollbar-color:var(--muted-foreground)_var(--muted)] [scrollbar-gutter:stable] [scrollbar-width:auto] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:border-t [&::-webkit-scrollbar-track]:border-border [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:min-w-12 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-muted [&::-webkit-scrollbar-thumb]:bg-muted-foreground"
      >
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-2">
              <Checkbox
                checked={
                  allSelected
                    ? true
                    : selected.size > 0
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={onToggleSelectAll}
                aria-label="Alle auswählen"
              />
            </TableHead>
            <TableHead className={columns.request}>Antrag</TableHead>
            {canManageReimbursements ? (
              <TableHead className={columns.applicant}>Antragsteller</TableHead>
            ) : null}
            <TableHead
              className={columns.project}
              data-reimbursement-column="project"
            >
              Projekt
            </TableHead>
            <TableHead className={columns.created}>Erstellt</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead className={columns.reviewedBy}>Bearbeitet von</TableHead>
            <TableHead className={columns.status}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reimbursements.map((item) => (
            <ReimbursementRow
              key={item._id}
              item={item}
              canManageReimbursements={canManageReimbursements}
              canEdit={
                item.createdBy === currentUserId && !item.requestedExternally
              }
              selectionCheckbox={
                <Checkbox
                  checked={selected.has(`r:${item._id}`)}
                  onCheckedChange={() => onToggleSelect(`r:${item._id}`)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Antrag auswählen"
                />
              }
              title={
                item.type === "travel"
                  ? "Reisekostenerstattung"
                  : "Auslagenerstattung"
              }
              detail={item.type === "expense" ? item.receiptSummary : undefined}
              applicantName={item.submitterName || item.creatorName}
              onClick={() => onRowClick(item._id)}
              onApprove={() => onApproveReimbursement(item._id)}
              onMarkAsPaid={() => onMarkReimbursementAsPaid(item._id)}
              onRequestChanges={() =>
                onOpenChangesDialog("reimbursement", item._id)
              }
              onReject={() => onOpenRejectDialog("reimbursement", item._id)}
              onOpen={() => onOpenReimbursement(item._id)}
              onEdit={() => onEditReimbursement(item._id)}
              onDelete={() => onDeleteReimbursement(item._id)}
            />
          ))}

          {allowances.map((item) => (
            <ReimbursementRow
              key={item._id}
              item={item}
              canManageReimbursements={canManageReimbursements}
              canEdit={
                item.createdBy === currentUserId && !item.requestedExternally
              }
              selectionCheckbox={
                <Checkbox
                  checked={selected.has(`a:${item._id}`)}
                  onCheckedChange={() => onToggleSelect(`a:${item._id}`)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Antrag auswählen"
                />
              }
              title="Ehrenamtspauschale"
              detail={item.activityDescription}
              applicantName={item.volunteerName || item.creatorName}
              onApprove={() => onApproveAllowance(item._id)}
              onMarkAsPaid={() => onMarkAllowanceAsPaid(item._id)}
              onRequestChanges={() =>
                onOpenChangesDialog("allowance", item._id)
              }
              onReject={() => onOpenRejectDialog("allowance", item._id)}
              onOpen={() => onOpenAllowance(item)}
              onEdit={() => onEditAllowance(item._id)}
              onDelete={() => onDeleteAllowance(item._id)}
            />
          ))}
        </TableBody>
      </Table>
      <div
        className="flex items-center justify-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground @min-[34rem]/reimbursement-table:hidden"
        aria-hidden="true"
      >
        <MoveHorizontal className="size-4" />
        Seitlich scrollen für weitere Spalten
      </div>
    </div>
  );
}
