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
  Trash2,
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

export function ReimbursementPageUI({
  canManageReimbursements,
  currentUserId,
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
  onOpenChangesDialog,
  onOpenRejectDialog,
  onRejectDialogChange,
  onReject,
  isRejecting,
  onOpenReimbursement,
  onOpenAllowance,
  onEditReimbursement,
  onEditAllowance,
  onDeleteReimbursement,
  onDeleteAllowance,
  canDeleteSelected,
  onDeleteSelected,
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

      <div className="mb-4 flex flex-wrap items-start gap-2">
        {selected.size > 0 && (
          <fieldset
            aria-label={`Aktionen für ${selected.size} ausgewählte ${
              selected.size === 1 ? "Erstattung" : "Erstattungen"
            }`}
            className="flex w-fit flex-wrap items-center gap-2"
          >
            <div className="flex h-10 items-center rounded-md border-2 bg-muted px-3 text-sm font-medium">
              {selected.size} ausgewählt
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onBulkDownload}
              disabled={isBulkDownloading}
            >
              {isBulkDownloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {isBulkDownloading ? "Wird erstellt..." : "Herunterladen"}
            </Button>
            {canDeleteSelected ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={onDeleteSelected}
              >
                <Trash2 />
                Löschen
              </Button>
            ) : null}
          </fieldset>
        )}

        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {canManageReimbursements ? (
            <>
              <Button variant="outline" onClick={onFinomCsv}>
                <Table2 />
                Finom CSV
              </Button>
              <Button variant="outline" onClick={onSepaXml}>
                <FileCode2 />
                SEPA XML
              </Button>
            </>
          ) : null}
          <Button variant="primary" onClick={onNewClick}>
            <Plus />
            Neue Erstattung
          </Button>
          {canManageReimbursements ? (
            <Button variant="outline" onClick={onShareClick}>
              <Share2 />
              Erstattung anfordern
            </Button>
          ) : null}
        </div>
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
        currentUserId={currentUserId}
        reimbursements={reimbursements}
        allowances={allowances}
        selected={selected}
        onRowClick={onRowClick}
        onApproveReimbursement={onApproveReimbursement}
        onApproveAllowance={onApproveAllowance}
        onOpenChangesDialog={onOpenChangesDialog}
        onOpenRejectDialog={onOpenRejectDialog}
        onOpenReimbursement={onOpenReimbursement}
        onOpenAllowance={onOpenAllowance}
        onEditReimbursement={onEditReimbursement}
        onEditAllowance={onEditAllowance}
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
