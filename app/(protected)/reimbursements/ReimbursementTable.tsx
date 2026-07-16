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
import styles from "./ReimbursementTable.module.css";
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
    <div className={`${styles.tableShell} rounded-lg border bg-card`}>
      <span id="reimbursement-table-scroll-description" className="sr-only">
        Die Tabelle kann bei sehr schmalen Bildschirmen horizontal gescrollt
        werden.
      </span>
      <Table
        aria-label="Erstattungen"
        aria-describedby="reimbursement-table-scroll-description"
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
            <TableHead>Antrag</TableHead>
            {canManageReimbursements ? (
              <TableHead data-reimbursement-column="applicant">
                Antragsteller
              </TableHead>
            ) : null}
            <TableHead data-reimbursement-column="project">Projekt</TableHead>
            <TableHead data-reimbursement-column="created">Erstellt</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead data-reimbursement-column="reviewed-by">
              Bearbeitet von
            </TableHead>
            <TableHead>Status</TableHead>
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
      <div className={styles.scrollHint} aria-hidden="true">
        <MoveHorizontal />
        Seitlich scrollen für weitere Spalten
      </div>
    </div>
  );
}
