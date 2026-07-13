"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReimbursementRow } from "../../components/Tables/Reimbursements/ReimbursementRow";
import type { Allowance, Reimbursement, SelectionKey } from "./types";

type Props = {
  canManageReimbursements: boolean;
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  selected: Set<SelectionKey>;
  onRowClick: (id: string) => void;
  onApproveReimbursement: (id: string) => void;
  onApproveAllowance: (id: string) => void;
  onOpenRejectDialog: (type: "reimbursement" | "allowance", id: string) => void;
  onOpenReimbursement: (id: string) => void;
  onOpenAllowance: (allowance: Allowance) => void;
  onDeleteReimbursement: (id: string) => void;
  onDeleteAllowance: (id: string) => void;
  onToggleSelect: (key: SelectionKey) => void;
  onToggleSelectAll: () => void;
};

export function ReimbursementTable({
  canManageReimbursements,
  reimbursements,
  allowances,
  selected,
  onRowClick,
  onApproveReimbursement,
  onApproveAllowance,
  onOpenRejectDialog,
  onOpenReimbursement,
  onOpenAllowance,
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
    <div className="rounded-lg border bg-card">
      <Table>
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
              <TableHead>Antragsteller</TableHead>
            ) : null}
            <TableHead>Projekt</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reimbursements.map((item) => (
            <ReimbursementRow
              key={item._id}
              item={item}
              canManageReimbursements={canManageReimbursements}
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
              detail={
                item.type === "expense"
                  ? item.description?.trim() || item.receiptSummary
                  : undefined
              }
              applicantName={item.submitterName || item.creatorName}
              onClick={() => onRowClick(item._id)}
              onApprove={() => onApproveReimbursement(item._id)}
              onReject={() => onOpenRejectDialog("reimbursement", item._id)}
              onOpen={() => onOpenReimbursement(item._id)}
              onDelete={() => onDeleteReimbursement(item._id)}
            />
          ))}

          {allowances.map((item) => (
            <ReimbursementRow
              key={item._id}
              item={item}
              canManageReimbursements={canManageReimbursements}
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
              onReject={() => onOpenRejectDialog("allowance", item._id)}
              onOpen={() => onOpenAllowance(item)}
              onDelete={() => onDeleteAllowance(item._id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
