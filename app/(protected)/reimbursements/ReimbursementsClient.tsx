"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import type { Project } from "@/lib/db/types";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import {
  approve as approveReimbursement,
  decline as declineReimbursement,
  deleteReimbursement,
} from "@/lib/server/reimbursements/actions";
import {
  approve as approveAllowance,
  decline as declineAllowance,
  remove as removeAllowance,
} from "@/lib/server/volunteerAllowance/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ReimbursementPageUI } from "./ReimbursementPageUI";
import type {
  Allowance,
  Reimbursement,
  RejectDialog,
  SelectionKey,
} from "./types";
import { usePaymentExports } from "./usePaymentExports";
import { usePdfDownloads } from "./usePdfDownloads";

interface Props {
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  projects: Project[];
}

export function ReimbursementsClient({
  reimbursements,
  allowances,
  projects,
}: Props) {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const [rejectDialog, setRejectDialog] = useState<RejectDialog>({
    open: false,
    type: "reimbursement",
    id: null,
    note: "",
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<SelectionKey>>(new Set());

  const { handleFinomCsv, handleSepaXml } = usePaymentExports(reimbursements);
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

  const handleReject = async () => {
    if (!rejectDialog.id || !rejectDialog.note) return;

    try {
      if (rejectDialog.type === "reimbursement") {
        await declineReimbursement({
          reimbursementId: rejectDialog.id,
          rejectionNote: rejectDialog.note,
        });
      } else {
        await declineAllowance({
          id: rejectDialog.id,
          rejectionNote: rejectDialog.note,
        });
      }
      toast.success("Abgelehnt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Ablehnen");
    }

    setRejectDialog({ open: false, type: "reimbursement", id: null, note: "" });
  };

  const handleApproveReimbursement = async (id: string) => {
    try {
      await approveReimbursement({ reimbursementId: id });
      toast.success("Genehmigt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Markieren");
    }
  };

  const handleApproveAllowance = async (id: string) => {
    try {
      await approveAllowance({ id });
      toast.success("Genehmigt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Genehmigen");
    }
  };

  const handleDeleteReimbursement = async (id: string) => {
    try {
      await deleteReimbursement({ reimbursementId: id });
      toast.success("Gelöscht");
      router.refresh();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    try {
      await removeAllowance({ id });
      toast.success("Gelöscht");
      router.refresh();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleToggleSelect = (key: SelectionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleOpenRejectDialog = (
    type: "reimbursement" | "allowance",
    id: string,
  ) => {
    setRejectDialog({ open: true, type, id, note: "" });
  };

  return (
    <>
      <ReimbursementPageUI
        isAdmin={isAdmin}
        isLoading={false}
        reimbursements={reimbursements}
        allowances={allowances}
        rejectDialog={rejectDialog}
        selected={selected}
        isBulkDownloading={isBulkDownloading}
        onNewClick={() => router.push("/reimbursements/new")}
        onShareClick={() => setShareModalOpen(true)}
        onRowClick={(id) => router.push(`/reimbursements/${id}`)}
        onApproveReimbursement={handleApproveReimbursement}
        onApproveAllowance={handleApproveAllowance}
        onOpenRejectDialog={handleOpenRejectDialog}
        onRejectDialogChange={setRejectDialog}
        onReject={handleReject}
        onDownloadReimbursement={handleDownloadReimbursement}
        onDownloadAllowance={handleDownloadAllowance}
        onDeleteReimbursement={handleDeleteReimbursement}
        onDeleteAllowance={handleDeleteAllowance}
        onToggleSelect={handleToggleSelect}
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
