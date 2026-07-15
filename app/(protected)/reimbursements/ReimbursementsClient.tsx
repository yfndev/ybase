"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ShareModal } from "@/components/Reimbursements/ShareModal";
import type { Project } from "@/lib/db/types";
import { useCanManageReimbursements } from "@/lib/hooks/useCurrentUserRole";
import { DeleteReimbursementsDialog } from "./DeleteReimbursementsDialog";
import { ReimbursementPageUI } from "./ReimbursementPageUI";
import type {
  Allowance,
  Reimbursement,
  ReimbursementTypeFilter,
  SelectionKey,
} from "./types";
import { usePaymentExports } from "./usePaymentExports";
import { usePdfDownloads } from "./usePdfDownloads";
import { useReimbursementActions } from "./useReimbursementActions";
import { useReimbursementSelection } from "./useReimbursementSelection";

interface Props {
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  projects: Project[];
  organizationName: string;
  currentUserId: string;
}

export function ReimbursementsClient({
  reimbursements,
  allowances,
  projects,
  organizationName,
  currentUserId,
}: Props) {
  const canManageReimbursements = useCanManageReimbursements();
  const router = useRouter();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ReimbursementTypeFilter>("all");
  const [deleteKeys, setDeleteKeys] = useState<SelectionKey[]>([]);

  const filteredReimbursements = useMemo(
    () =>
      reimbursements.filter(
        (item) => typeFilter === "all" || item.type === typeFilter,
      ),
    [reimbursements, typeFilter],
  );
  const filteredAllowances = useMemo(
    () =>
      typeFilter === "all" || typeFilter === "allowance" ? allowances : [],
    [allowances, typeFilter],
  );
  const selection = useReimbursementSelection(
    filteredReimbursements,
    filteredAllowances,
  );
  const { selected } = selection;

  const actions = useReimbursementActions();
  const { handleFinomCsv, handleSepaXml } = usePaymentExports({
    reimbursements,
    allowances,
    selected,
    organizationName,
    clearSelection: selection.clearSelection,
  });
  const {
    isBulkDownloading,
    handleOpenReimbursement,
    handleOpenAllowance,
    handleBulkDownload,
  } = usePdfDownloads({
    allowances,
    selected,
    clearSelection: selection.clearSelection,
  });

  const handleTypeFilterChange = (value: ReimbursementTypeFilter) => {
    setTypeFilter(value);
    selection.clearSelection();
  };

  const canDeleteSelected = canManageReimbursements && selected.size > 0;

  const handleConfirmDelete = async () => {
    const deletedKeys = await actions.handleDelete(deleteKeys);
    if (deletedKeys.length > 0) selection.removeSelection(deletedKeys);
    setDeleteKeys([]);
  };

  const singleDeleteLabel = (() => {
    if (deleteKeys.length !== 1) return undefined;
    const key = deleteKeys[0];
    if (key.startsWith("a:")) return "Ehrenamtspauschale";
    return reimbursements.find((item) => item._id === key.slice(2))?.type ===
      "travel"
      ? "Reisekostenerstattung"
      : "Auslagenerstattung";
  })();

  return (
    <>
      <ReimbursementPageUI
        canManageReimbursements={canManageReimbursements}
        currentUserId={currentUserId}
        reimbursements={filteredReimbursements}
        allowances={filteredAllowances}
        typeFilter={typeFilter}
        rejectDialog={actions.rejectDialog}
        selected={selected}
        isBulkDownloading={isBulkDownloading}
        onNewClick={() => router.push("/reimbursements/new")}
        onShareClick={() => setShareModalOpen(true)}
        onRowClick={(id) => router.push(`/reimbursements/${id}`)}
        onApproveReimbursement={actions.handleApproveReimbursement}
        onApproveAllowance={actions.handleApproveAllowance}
        onOpenChangesDialog={(type, id) =>
          actions.handleOpenReviewDialog("changes", type, id)
        }
        onOpenRejectDialog={(type, id) =>
          actions.handleOpenReviewDialog("reject", type, id)
        }
        onRejectDialogChange={actions.setRejectDialog}
        onReject={actions.handleReview}
        isRejecting={actions.isRejecting}
        onOpenReimbursement={handleOpenReimbursement}
        onOpenAllowance={handleOpenAllowance}
        onEditReimbursement={(id) => router.push(`/erstattung/${id}`)}
        onEditAllowance={(id) => router.push(`/ehrenamtspauschale/${id}`)}
        onDeleteReimbursement={(id) => setDeleteKeys([`r:${id}`])}
        onDeleteAllowance={(id) => setDeleteKeys([`a:${id}`])}
        canDeleteSelected={canDeleteSelected}
        onDeleteSelected={() => setDeleteKeys([...selected])}
        onToggleSelect={selection.toggleSelection}
        onToggleSelectAll={selection.toggleAll}
        onTypeFilterChange={handleTypeFilterChange}
        onBulkDownload={handleBulkDownload}
        onFinomCsv={handleFinomCsv}
        onSepaXml={handleSepaXml}
      />
      {canManageReimbursements ? (
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          projects={projects}
        />
      ) : null}
      <DeleteReimbursementsDialog
        count={deleteKeys.length}
        singleItemLabel={singleDeleteLabel}
        isDeleting={actions.isDeleting}
        onCancel={() => setDeleteKeys([])}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
