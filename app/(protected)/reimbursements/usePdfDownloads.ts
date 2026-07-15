import JSZip from "jszip";
import { useState } from "react";
import toast from "react-hot-toast";
import { downloadBlob } from "@/lib/fileHandlers/downloadBlob";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { shortReferenceId } from "@/lib/fileHandlers/referenceId";
import { getReimbursementPdfData } from "@/lib/server/reimbursements/files";
import { getSignatureUrlAction } from "@/lib/server/volunteerAllowance/actions";
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
      const allowanceById = new Map(
        allowances.map((allowance) => [allowance._id, allowance]),
      );
      const pdfs = await Promise.all(
        [...selected].map(async (key) => {
          if (key.startsWith("r:")) {
            const id = key.slice(2);
            const blob = await getPdfBlobForReimbursement(id);
            return blob
              ? { name: `Erstattung_${shortReferenceId(id)}.pdf`, blob }
              : null;
          }

          const id = key.slice(2);
          const allowance = allowanceById.get(id);
          if (allowance) {
            const blob = await getPdfBlobForAllowance(allowance);
            return blob
              ? {
                  name: `Ehrenamtspauschale_${shortReferenceId(id)}.pdf`,
                  blob,
                }
              : null;
          }
          return null;
        }),
      );

      for (const pdf of pdfs) {
        if (pdf) zip.file(pdf.name, pdf.blob);
      }

      if (pdfs.every((pdf) => pdf === null)) {
        toast.error("Für die Auswahl konnten keine PDFs erstellt werden");
        return;
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
