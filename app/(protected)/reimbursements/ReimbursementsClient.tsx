"use client";

import { ShareModal } from "@/components/Reimbursements/ShareModal";
import type { Project } from "@/lib/db/types";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateSEPAXML } from "@/lib/fileHandlers/generateSEPAXML";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { shortReferenceId } from "@/lib/fileHandlers/referenceId";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import {
  approve as approveReimbursement,
  decline as declineReimbursement,
  deleteReimbursement,
  getReimbursementPdfData,
} from "@/lib/server/reimbursements/actions";
import {
  approve as approveAllowance,
  decline as declineAllowance,
  getSignatureUrlAction,
  remove as removeAllowance,
} from "@/lib/server/volunteerAllowance/actions";
import JSZip from "jszip";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  type Allowance,
  ReimbursementPageUI,
  type Reimbursement,
  type SelectionKey,
} from "./ReimbursementPageUI";

type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: string | null;
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
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

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

  const getPdfBlobForReimbursement = async (
    id: string,
  ): Promise<Blob | null> => {
    const data = await getReimbursementPdfData(id);
    if (!data || !data.reimbursement) return null;

    return generateReimbursementPDF(
      {
        ...data.reimbursement,
        organization: data.organization,
        signatureUrl: data.signatureUrl,
      },
      data.receiptsWithUrls,
    );
  };

  const getPdfBlobForAllowance = async (
    allowance: Allowance,
  ): Promise<Blob | null> => {
    if (!allowance.signatureStorageId) return null;
    const signatureUrl = await getSignatureUrlAction(
      allowance.signatureStorageId,
    );
    return generateVolunteerAllowancePDF(
      { ...allowance, id: shortReferenceId(allowance._id) },
      signatureUrl,
    );
  };

  const handleDownloadReimbursement = async (id: string) => {
    const blob = await getPdfBlobForReimbursement(id);
    if (blob) downloadBlob(blob, `Erstattung_${shortReferenceId(id)}.pdf`);
  };

  const handleDownloadAllowance = async (allowance: Allowance) => {
    const blob = await getPdfBlobForAllowance(allowance);
    if (blob)
      downloadBlob(
        blob,
        `Ehrenamtspauschale_${shortReferenceId(allowance._id)}.pdf`,
      );
  };

  const handleBulkDownload = async () => {
    if (selected.size === 0) return;
    setIsBulkDownloading(true);

    try {
      const zip = new JSZip();

      for (const key of selected) {
        if (key.startsWith("r:")) {
          const id = key.slice(2);
          const blob = await getPdfBlobForReimbursement(id);
          if (blob) zip.file(`Erstattung_${shortReferenceId(id)}.pdf`, blob);
        } else if (key.startsWith("a:")) {
          const id = key.slice(2);
          const allowance = allowances.find((item) => item._id === id);
          if (allowance) {
            const blob = await getPdfBlobForAllowance(allowance);
            if (blob)
              zip.file(`Ehrenamtspauschale_${shortReferenceId(id)}.pdf`, blob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(
        zipBlob,
        `Erstattungen_${new Date().toISOString().slice(0, 10)}.zip`,
      );
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
    const approved = reimbursements.filter(
      (item) => item.status === "approved" && item.iban && item.accountHolder,
    );

    if (approved.length === 0) {
      toast.error("Keine genehmigten Erstattungen mit IBAN vorhanden");
      return;
    }

    const blob = generateSEPAXML({
      organizationName: "Verein",
      payments: approved.map((item) => ({
        id: item._id,
        name: item.accountHolder,
        iban: item.iban,
        bic: item.bic,
        amount: item.amount,
        currency: item.currency ?? "EUR",
        reference: `Erstattung ${item._id}`,
      })),
    });

    downloadBlob(blob, `SEPA_${new Date().toISOString().slice(0, 10)}.xml`);
    toast.success(`${approved.length} Überweisungen exportiert`);
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
