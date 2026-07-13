import { downloadBlob } from "@/lib/fileHandlers/downloadBlob";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { shortReferenceId } from "@/lib/fileHandlers/referenceId";
import { getReimbursementPdfData } from "@/lib/server/reimbursements/actions";
import { getSignatureUrlAction } from "@/lib/server/volunteerAllowance/actions";
import JSZip from "jszip";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Allowance, SelectionKey } from "./types";

type Params = {
  allowances: Allowance[];
  selected: Set<SelectionKey>;
  clearSelection: () => void;
};

export function usePdfDownloads({
  allowances,
  selected,
  clearSelection,
}: Params) {
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

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

  const openPdfInNewTab = async (createPdf: () => Promise<Blob | null>) => {
    const pdfWindow = window.open("about:blank", "_blank");

    if (!pdfWindow) {
      toast.error("Neuer Tab konnte nicht geöffnet werden");
      return;
    }

    pdfWindow.opener = null;

    try {
      const blob = await createPdf();
      if (!blob) {
        pdfWindow.close();
        toast.error("PDF konnte nicht erstellt werden");
        return;
      }

      const url = URL.createObjectURL(blob);
      pdfWindow.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      pdfWindow.close();
      toast.error("Fehler beim Öffnen der PDF");
    }
  };

  const handleOpenReimbursement = (id: string) =>
    openPdfInNewTab(() => getPdfBlobForReimbursement(id));

  const handleOpenAllowance = (allowance: Allowance) =>
    openPdfInNewTab(() => getPdfBlobForAllowance(allowance));

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
      clearSelection();
    } catch {
      toast.error("Fehler beim Erstellen des Downloads");
    } finally {
      setIsBulkDownloading(false);
    }
  };

  return {
    isBulkDownloading,
    handleOpenReimbursement,
    handleOpenAllowance,
    handleBulkDownload,
  };
}
