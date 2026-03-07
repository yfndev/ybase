"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ReimbursementPageUI } from "./ReimbursementPageUI";

type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: Id<"reimbursements"> | Id<"volunteerAllowance"> | null;
  note: string;
};

type Allowance = NonNullable<
  ReturnType<typeof useQuery<typeof api.volunteerAllowance.queries.getAll>>
>[number];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReimbursementPage() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const convex = useConvex();

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

  const handleDownloadReimbursement = async (id: Id<"reimbursements">) => {
    const reimbursement = await convex.query(
      api.reimbursements.queries.getReimbursement,
      {
        reimbursementId: id,
      },
    );
    if (!reimbursement) return;

    const receipts = await convex.query(
      api.reimbursements.queries.getReceipts,
      {
        reimbursementId: id,
      },
    );

    const receiptsWithUrls = await Promise.all(
      receipts.map(async (receipt) => ({
        ...receipt,
        fileUrl: await convex.query(api.reimbursements.queries.getFileUrl, {
          storageId: receipt.fileStorageId,
        }),
      })),
    );

    const pdfBlob = await generateReimbursementPDF(
      reimbursement,
      receiptsWithUrls,
    );
    downloadBlob(pdfBlob, `Erstattung_${id}.pdf`);
  };

  const handleDownloadAllowance = async (allowance: Allowance) => {
    if (!allowance.signatureStorageId) return;

    const signatureUrl = await convex.query(
      api.volunteerAllowance.queries.getSignatureUrl,
      {
        storageId: allowance.signatureStorageId,
      },
    );

    const pdfBlob = await generateVolunteerAllowancePDF(
      allowance,
      signatureUrl,
    );
    downloadBlob(pdfBlob, `Ehrenamtspauschale_${allowance._id}.pdf`);
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
      />
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </>
  );
}
