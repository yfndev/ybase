"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import type { Project } from "@/lib/db/types";
import { useCanManageReimbursements } from "@/lib/hooks/useCurrentUserRole";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [selected, setSelected] = useState<Set<SelectionKey>>(new Set());
  const [typeFilter, setTypeFilter] = useState<ReimbursementTypeFilter>("all");

  const filteredReimbursements = reimbursements.filter(
    (item) => typeFilter === "all" || item.type === typeFilter,
  );
  const filteredAllowances =
    typeFilter === "all" || typeFilter === "allowance" ? allowances : [];

  const actions = useReimbursementActions();
  const { handleFinomCsv, handleSepaXml } = usePaymentExports(
    reimbursements,
    organizationName,
  );
  const {
    isBulkDownloading,
    handleOpenReimbursement,
    handleOpenAllowance,
    handleBulkDownload,
  } = usePdfDownloads({
    allowances,
    selected,
    clearSelection: () => setSelected(new Set()),
  });

  const handleToggleSelect = (key: SelectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allKeys: SelectionKey[] = [
      ...filteredReimbursements.map((item): SelectionKey => `r:${item._id}`),
      ...filteredAllowances.map((item): SelectionKey => `a:${item._id}`),
    ];
    setSelected((prev) =>
      prev.size === allKeys.length ? new Set() : new Set(allKeys),
    );
  };

  const handleTypeFilterChange = (value: ReimbursementTypeFilter) => {
    setTypeFilter(value);
    setSelected(new Set());
  };

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
        onDeleteReimbursement={actions.handleDeleteReimbursement}
        onDeleteAllowance={actions.handleDeleteAllowance}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
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
    </>
  );
}
