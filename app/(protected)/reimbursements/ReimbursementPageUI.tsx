"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ReimbursementTypeFilter,
  SelectionKey,
} from "./types";

interface Props {
  canManageReimbursements: boolean;
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
  onOpenRejectDialog: (type: "reimbursement" | "allowance", id: string) => void;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
  isRejecting: boolean;
  onOpenReimbursement: (id: string) => void;
  onOpenAllowance: (allowance: Allowance) => void;
  onDeleteReimbursement: (id: string) => void;
  onDeleteAllowance: (id: string) => void;
  onToggleSelect: (key: SelectionKey) => void;
  onToggleSelectAll: () => void;
  onTypeFilterChange: (value: ReimbursementTypeFilter) => void;
  onBulkDownload: () => void;
  onFinomCsv: () => void;
  onSepaXml: () => void;
}

export function ReimbursementPageUI({
  canManageReimbursements,
  reimbursements,
  allowances,
  typeFilter,
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
  isRejecting,
  onOpenReimbursement,
  onOpenAllowance,
  onDeleteReimbursement,
  onDeleteAllowance,
  onToggleSelect,
  onToggleSelectAll,
  onTypeFilterChange,
  onBulkDownload,
  onFinomCsv,
  onSepaXml,
}: Props) {
  return (
    <div className="flex flex-col w-full">
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
        {canManageReimbursements ? (
          <>
            <Button variant="outline" onClick={onFinomCsv}>
              <Table2 className="h-4 w-4 mr-2" />
              Finom CSV
            </Button>
            <Button variant="outline" onClick={onSepaXml}>
              <FileCode2 className="h-4 w-4 mr-2" />
              SEPA XML
            </Button>
          </>
        ) : null}
        <Button variant="primary" onClick={onNewClick}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Erstattung
        </Button>
        {canManageReimbursements ? (
          <Button variant="outline" onClick={onShareClick}>
            <Share2 className="h-4 w-4 mr-2" />
            Erstattung anfordern
          </Button>
        ) : null}
      </div>

      <Tabs
        value={typeFilter}
        onValueChange={(value) =>
          onTypeFilterChange(value as ReimbursementTypeFilter)
        }
        className="mb-4"
      >
        <TabsList aria-label="Erstattungsart filtern">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="travel">Reisekostenerstattung</TabsTrigger>
          <TabsTrigger value="expense">Auslagenerstattung</TabsTrigger>
          <TabsTrigger value="allowance">Ehrenamtspauschale</TabsTrigger>
        </TabsList>
      </Tabs>

      <ReimbursementTable
        canManageReimbursements={canManageReimbursements}
        reimbursements={reimbursements}
        allowances={allowances}
        selected={selected}
        onRowClick={onRowClick}
        onApproveReimbursement={onApproveReimbursement}
        onApproveAllowance={onApproveAllowance}
        onOpenRejectDialog={onOpenRejectDialog}
        onOpenReimbursement={onOpenReimbursement}
        onOpenAllowance={onOpenAllowance}
        onDeleteReimbursement={onDeleteReimbursement}
        onDeleteAllowance={onDeleteAllowance}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
      />

      <RejectDialogModal
        rejectDialog={rejectDialog}
        onRejectDialogChange={onRejectDialogChange}
        onReject={onReject}
        isRejecting={isRejecting}
      />
    </div>
  );
}
