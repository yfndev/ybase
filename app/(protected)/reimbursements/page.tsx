"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ReimbursementPageUI } from "./ReimbursementPageUI";
import type { RejectDialog, SelectionKey } from "./types";
import { usePaymentExports } from "./usePaymentExports";
import { usePdfDownloads } from "./usePdfDownloads";

export default function ReimbursementPage() {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const reimbursements = useQuery(
    api.reimbursements.queries.getAllReimbursements,
  );
  const allowances = useQuery(api.volunteerAllowance.queries.getAll);

  const approveReimbursementMutation = useMutation(
    api.reimbursements.functions.approve,
  );
  const declineReimbursementMutation = useMutation(
    api.reimbursements.functions.decline,
  );
  const deleteReimbursementMutation = useMutation(
    api.reimbursements.functions.deleteReimbursement,
  );
  const approveAllowanceMutation = useMutation(
    api.volunteerAllowance.functions.approve,
  );
  const declineAllowanceMutation = useMutation(
    api.volunteerAllowance.functions.decline,
  );
  const deleteAllowanceMutation = useMutation(
    api.volunteerAllowance.functions.remove,
  );

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
    allowances: allowances ?? [],
    selected,
    clearSelection: () => setSelected(new Set()),
  });

  const handleReject = async () => {
    if (!rejectDialog.id || !rejectDialog.note) return;

    try {
      if (rejectDialog.type === "reimbursement") {
        await declineReimbursementMutation({
          reimbursementId: rejectDialog.id as Id<"reimbursements">,
          rejectionNote: rejectDialog.note,
        });
      } else {
        await declineAllowanceMutation({
          id: rejectDialog.id as Id<"volunteerAllowance">,
          rejectionNote: rejectDialog.note,
        });
      }
      toast.success("Abgelehnt");
    } catch {
      toast.error("Fehler beim Ablehnen");
    }

    setRejectDialog({ open: false, type: "reimbursement", id: null, note: "" });
  };

  const handleApproveReimbursement = async (id: Id<"reimbursements">) => {
    try {
      await approveReimbursementMutation({ reimbursementId: id });
      toast.success("Genehmigt");
    } catch {
      toast.error("Fehler beim Markieren");
    }
  };

  const handleApproveAllowance = async (id: Id<"volunteerAllowance">) => {
    try {
      await approveAllowanceMutation({ id });
      toast.success("Genehmigt");
    } catch {
      toast.error("Fehler beim Genehmigen");
    }
  };

  const handleDeleteReimbursement = async (id: Id<"reimbursements">) => {
    try {
      await deleteReimbursementMutation({ reimbursementId: id });
      toast.success("Gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleDeleteAllowance = async (id: Id<"volunteerAllowance">) => {
    try {
      await deleteAllowanceMutation({ id });
      toast.success("Gelöscht");
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
    id: Id<"reimbursements"> | Id<"volunteerAllowance">,
  ) => {
    setRejectDialog({ open: true, type, id, note: "" });
  };

  return (
    <>
      <ReimbursementPageUI
        isAdmin={isAdmin}
        isLoading={!reimbursements || !allowances}
        reimbursements={reimbursements ?? []}
        allowances={allowances ?? []}
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
      />
    </>
  );
}
