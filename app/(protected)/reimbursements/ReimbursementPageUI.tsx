"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileCode2,
  Loader2,
  Plus,
  Share2,
  Table2,
} from "lucide-react";
import { ReimbursementTable } from "./ReimbursementTable";
import { RejectDialogModal } from "./RejectDialogModal";
import type {
  Allowance,
  RejectDialog,
  Reimbursement,
  SelectionKey,
} from "./types";

interface Props {
  isAdmin: boolean;
  isLoading: boolean;
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  rejectDialog: RejectDialog;
  selected: Set<SelectionKey>;
  isBulkDownloading: boolean;
  onNewClick: () => void;
  onShareClick: () => void;
  onRowClick: (id: string) => void;
  onApproveReimbursement: (id: string) => void;
  onApproveAllowance: (id: string) => void;
  onOpenRejectDialog: (
    type: "reimbursement" | "allowance",
    id: string,
  ) => void;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
  onDownloadReimbursement: (id: string) => void;
  onDownloadAllowance: (allowance: Allowance) => void;
  onDeleteReimbursement: (id: string) => void;
  onDeleteAllowance: (id: string) => void;
  onToggleSelect: (key: SelectionKey) => void;
  onBulkDownload: () => void;
  onFinomCsv: () => void;
  onSepaXml: () => void;
}

export function ReimbursementPageUI({
  isAdmin,
  isLoading,
  reimbursements,
  allowances,
  rejectDialog,
  selected,
  isBulkDownloading,
  onNewClick,
  onShareClick,
  onRowClick,
  onApproveReimbursement,
  onApproveAllowance,
  onOpenRejectDialog,
  onRejectDialogChange,
  onReject,
  onDownloadReimbursement,
  onDownloadAllowance,
  onDeleteReimbursement,
  onDeleteAllowance,
  onToggleSelect,
  onBulkDownload,
  onFinomCsv,
  onSepaXml,
}: Props) {
  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Erstattungen" />

      <div className="flex justify-end gap-2 mb-4">
        {selected.size > 0 && (
          <Button
            variant="outline"
            onClick={onBulkDownload}
            disabled={isBulkDownloading}
          >
            {isBulkDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isBulkDownloading
              ? "Wird erstellt..."
              : `${selected.size} herunterladen`}
          </Button>
        )}
        <Button variant="outline" onClick={onFinomCsv}>
          <Table2 className="h-4 w-4 mr-2" />
          Finom CSV
        </Button>
        <Button variant="outline" onClick={onSepaXml}>
          <FileCode2 className="h-4 w-4 mr-2" />
          SEPA XML
        </Button>
        <Button variant="outline" onClick={onNewClick}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Erstattung
        </Button>
        <Button variant="outline" onClick={onShareClick}>
          <Share2 className="h-4 w-4 mr-2" />
          Erstattung anfordern
        </Button>
      </div>

      <ReimbursementTable
        isAdmin={isAdmin}
        isLoading={isLoading}
        reimbursements={reimbursements}
        allowances={allowances}
        selected={selected}
        onRowClick={onRowClick}
        onApproveReimbursement={onApproveReimbursement}
        onApproveAllowance={onApproveAllowance}
        onOpenRejectDialog={onOpenRejectDialog}
        onDownloadReimbursement={onDownloadReimbursement}
        onDownloadAllowance={onDownloadAllowance}
        onDeleteReimbursement={onDeleteReimbursement}
        onDeleteAllowance={onDeleteAllowance}
        onToggleSelect={onToggleSelect}
      />

      <RejectDialogModal
        rejectDialog={rejectDialog}
        onRejectDialogChange={onRejectDialogChange}
        onReject={onReject}
      />
    </div>
  );
}
