"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import type { Project } from "@/lib/db/types";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReimbursementPageUI } from "./ReimbursementPageUI";
import type { Allowance, Reimbursement, SelectionKey } from "./types";
import { usePaymentExports } from "./usePaymentExports";
import { usePdfDownloads } from "./usePdfDownloads";
import { useReimbursementActions } from "./useReimbursementActions";

interface Props {
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  projects: Project[];
  organizationName: string;
}

export function ReimbursementsClient({
  reimbursements,
  allowances,
  projects,
  organizationName,
}: Props) {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<SelectionKey>>(new Set());

  const actions = useReimbursementActions();
  const { handleFinomCsv, handleSepaXml } = usePaymentExports(
    reimbursements,
    organizationName,
  );
  const {
    isBulkDownloading,
    handleDownloadReimbursement,
    handleDownloadAllowance,
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
      ...reimbursements.map((item): SelectionKey => `r:${item._id}`),
      ...allowances.map((item): SelectionKey => `a:${item._id}`),
    ];
    setSelected((prev) =>
      prev.size === allKeys.length ? new Set() : new Set(allKeys),
    );
  };

  return (
    <>
      <ReimbursementPageUI
        isAdmin={isAdmin}
        reimbursements={reimbursements}
        allowances={allowances}
        rejectDialog={actions.rejectDialog}
        selected={selected}
        isBulkDownloading={isBulkDownloading}
        onNewClick={() => router.push("/reimbursements/new")}
        onShareClick={() => setShareModalOpen(true)}
        onRowClick={(id) => router.push(`/reimbursements/${id}`)}
        onApproveReimbursement={actions.handleApproveReimbursement}
        onApproveAllowance={actions.handleApproveAllowance}
        onOpenRejectDialog={actions.handleOpenRejectDialog}
        onRejectDialogChange={actions.setRejectDialog}
        onReject={actions.handleReject}
        isRejecting={actions.isRejecting}
        onDownloadReimbursement={handleDownloadReimbursement}
        onDownloadAllowance={handleDownloadAllowance}
        onDeleteReimbursement={actions.handleDeleteReimbursement}
        onDeleteAllowance={actions.handleDeleteAllowance}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onBulkDownload={handleBulkDownload}
        onFinomCsv={handleFinomCsv}
        onSepaXml={handleSepaXml}
      />
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        projects={projects}
      />
    </>
  );
}
