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
  onDownloadReimbursement: (id: string) => void;
  onDownloadAllowance: (allowance: Allowance) => void;
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
  onDownloadReimbursement,
  onDownloadAllowance,
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
            <TableHead className="w-[30px]" />
            <TableHead>Datum</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead>Beschreibung</TableHead>
            {canManageReimbursements ? <TableHead>Ersteller</TableHead> : null}
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Geprüft von</TableHead>
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
                />
              }
              description={
                item.type === "travel" ? (
                  <div>
                    <span>{item.projectName}</span>
                    <span className="block text-xs text-muted-foreground">
                      Reisekostenerstattung
                      {item.travelDetails?.destination &&
                        ` - ${item.travelDetails.destination}`}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span>{item.projectName}</span>
                    <span className="block text-xs text-muted-foreground">
                      Auslagenerstattung
                    </span>
                  </div>
                )
              }
              onClick={() => onRowClick(item._id)}
              onApprove={() => onApproveReimbursement(item._id)}
              onReject={() => onOpenRejectDialog("reimbursement", item._id)}
              onDownload={() => onDownloadReimbursement(item._id)}
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
                />
              }
              description={
                <div>
                  <span>{item.projectName}</span>
                  <span className="block text-xs text-muted-foreground">
                    Ehrenamtspauschale
                  </span>
                </div>
              }
              onApprove={() => onApproveAllowance(item._id)}
              onReject={() => onOpenRejectDialog("allowance", item._id)}
              onDownload={() => onDownloadAllowance(item)}
              onDelete={() => onDeleteAllowance(item._id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
