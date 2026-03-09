"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { generateSEPAXML } from "@/lib/fileHandlers/generateSEPAXML";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import JSZip from "jszip";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { ReimbursementPageUI, type Allowance, type SelectionKey } from "./ReimbursementPageUI";

type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: Id<"reimbursements"> | Id<"volunteerAllowance"> | null;
  note: string;
};

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

  const reimbursements = useQuery(api.reimbursements.queries.getAllReimbursements);
  const allowances = useQuery(api.volunteerAllowance.queries.getAll);

  const approveReimbursementMutation = useMutation(api.reimbursements.functions.approve);
  const declineReimbursementMutation = useMutation(api.reimbursements.functions.decline);
  const deleteReimbursementMutation = useMutation(api.reimbursements.functions.deleteReimbursement);
  const approveAllowanceMutation = useMutation(api.volunteerAllowance.functions.approve);
  const declineAllowanceMutation = useMutation(api.volunteerAllowance.functions.decline);
  const deleteAllowanceMutation = useMutation(api.volunteerAllowance.functions.remove);

  const [rejectDialog, setRejectDialog] = useState<RejectDialog>({
    open: false,
    type: "reimbursement",
    id: null,
    note: "",
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<SelectionKey>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

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

  const getPdfBlobForReimbursement = async (id: Id<"reimbursements">): Promise<Blob | null> => {
    const reimbursement = await convex.query(api.reimbursements.queries.getReimbursement, { reimbursementId: id });
    if (!reimbursement) return null;

    const receipts = await convex.query(api.reimbursements.queries.getReceipts, { reimbursementId: id });
    const receiptsWithUrls = await Promise.all(
      receipts.map(async (receipt) => ({
        ...receipt,
        fileUrl: await convex.query(api.reimbursements.queries.getFileUrl, { storageId: receipt.fileStorageId }),
      })),
    );

    return generateReimbursementPDF(reimbursement, receiptsWithUrls);
  };

  const getPdfBlobForAllowance = async (allowance: Allowance): Promise<Blob | null> => {
    if (!allowance.signatureStorageId) return null;
    const signatureUrl = await convex.query(api.volunteerAllowance.queries.getSignatureUrl, {
      storageId: allowance.signatureStorageId,
    });
    return generateVolunteerAllowancePDF({ ...allowance, id: allowance._id }, signatureUrl);
  };

  const handleDownloadReimbursement = async (id: Id<"reimbursements">) => {
    const blob = await getPdfBlobForReimbursement(id);
    if (blob) downloadBlob(blob, `Erstattung_${id}.pdf`);
  };

  const handleDownloadAllowance = async (allowance: Allowance) => {
    const blob = await getPdfBlobForAllowance(allowance);
    if (blob) downloadBlob(blob, `Ehrenamtspauschale_${allowance._id}.pdf`);
  };

  const handleBulkDownload = async () => {
    if (selected.size === 0) return;
    setIsBulkDownloading(true);

    try {
      const zip = new JSZip();

      for (const key of selected) {
        if (key.startsWith("r:")) {
          const id = key.slice(2) as Id<"reimbursements">;
          const blob = await getPdfBlobForReimbursement(id);
          if (blob) zip.file(`Erstattung_${id}.pdf`, blob);
        } else if (key.startsWith("a:")) {
          const id = key.slice(2) as Id<"volunteerAllowance">;
          const allowance = allowances?.find((a) => a._id === id);
          if (allowance) {
            const blob = await getPdfBlobForAllowance(allowance);
            if (blob) zip.file(`Ehrenamtspauschale_${id}.pdf`, blob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `Erstattungen_${new Date().toISOString().slice(0, 10)}.zip`);
      setSelected(new Set());
    } catch {
      toast.error("Fehler beim Erstellen des Downloads");
    } finally {
      setIsBulkDownloading(false);
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

  const handleSepaXml = () => {
    const approved = (reimbursements ?? []).filter(
      (r) => r.status === "approved" && r.iban && r.accountHolder
    );

    if (approved.length === 0) {
      toast.error("Keine genehmigten Erstattungen mit IBAN vorhanden");
      return;
    }

    const blob = generateSEPAXML({
      organizationName: "Verein",
      payments: approved.map((r) => ({
        id: r._id,
        name: r.accountHolder,
        iban: r.iban,
        bic: r.bic,
        amount: r.amount,
        currency: r.currency ?? "EUR",
        reference: `Erstattung ${r._id}`,
      })),
    });

    downloadBlob(blob, `SEPA_${new Date().toISOString().slice(0, 10)}.xml`);
    toast.success(`${approved.length} Überweisungen exportiert`);
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
        onSepaXml={handleSepaXml}
      />
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </>
  );
}
