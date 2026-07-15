"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { ReimbursementFilters } from "./ReimbursementFilters";
import { ReimbursementTable } from "./ReimbursementTable";
import { ReimbursementToolbar } from "./ReimbursementToolbar";
import { ReviewDialog } from "./ReviewDialog";
import type {
  Allowance,
  Reimbursement,
  ReimbursementTypeFilter,
  RejectDialog,
  SelectionKey,
} from "./types";

interface Props {
  canManageReimbursements: boolean;
  currentUserId: string;
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  typeFilter: ReimbursementTypeFilter;
  rejectDialog: RejectDialog;
  selected: Set<SelectionKey>;
  isBulkDownloading: boolean;
  onNewClick: () => void;
  onShareClick: () => void;
  onRowClick: (id: string) => void;
  onApproveReimbursement: (id: string) => void;
  onApproveAllowance: (id: string) => void;
  onOpenChangesDialog: (
    type: "reimbursement" | "allowance",
    id: string,
  ) => void;
  onOpenRejectDialog: (type: "reimbursement" | "allowance", id: string) => void;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
  isRejecting: boolean;
  onOpenReimbursement: (id: string) => void;
  onOpenAllowance: (allowance: Allowance) => void;
  onEditReimbursement: (id: string) => void;
  onEditAllowance: (id: string) => void;
  onDeleteReimbursement: (id: string) => void;
  onDeleteAllowance: (id: string) => void;
  canDeleteSelected: boolean;
  onDeleteSelected: () => void;
  onToggleSelect: (key: SelectionKey) => void;
  onToggleSelectAll: () => void;
  onTypeFilterChange: (value: ReimbursementTypeFilter) => void;
  onBulkDownload: () => void;
  onFinomCsv: () => void;
  onSepaXml: () => void;
}

export function ReimbursementPageUI(props: Props) {
  return (
    <div className="flex w-full flex-col">
      <PageHeader title="Erstattungen" />
      <ReimbursementToolbar
        canManageReimbursements={props.canManageReimbursements}
        selectedCount={props.selected.size}
        canDeleteSelected={props.canDeleteSelected}
        isBulkDownloading={props.isBulkDownloading}
        onNewClick={props.onNewClick}
        onShareClick={props.onShareClick}
        onDeleteSelected={props.onDeleteSelected}
        onBulkDownload={props.onBulkDownload}
        onFinomCsv={props.onFinomCsv}
        onSepaXml={props.onSepaXml}
      />
      <ReimbursementFilters
        value={props.typeFilter}
        onChange={props.onTypeFilterChange}
      />
      <ReimbursementTable
        canManageReimbursements={props.canManageReimbursements}
        currentUserId={props.currentUserId}
        reimbursements={props.reimbursements}
        allowances={props.allowances}
        selected={props.selected}
        onRowClick={props.onRowClick}
        onApproveReimbursement={props.onApproveReimbursement}
        onApproveAllowance={props.onApproveAllowance}
        onOpenChangesDialog={props.onOpenChangesDialog}
        onOpenRejectDialog={props.onOpenRejectDialog}
        onOpenReimbursement={props.onOpenReimbursement}
        onOpenAllowance={props.onOpenAllowance}
        onEditReimbursement={props.onEditReimbursement}
        onEditAllowance={props.onEditAllowance}
        onDeleteReimbursement={props.onDeleteReimbursement}
        onDeleteAllowance={props.onDeleteAllowance}
        onToggleSelect={props.onToggleSelect}
        onToggleSelectAll={props.onToggleSelectAll}
      />
      <ReviewDialog
        dialog={props.rejectDialog}
        onChange={props.onRejectDialogChange}
        onSubmit={props.onReject}
        isSubmitting={props.isRejecting}
      />
    </div>
  );
}
