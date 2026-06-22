import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { downloadBlob } from "@/lib/fileHandlers/downloadBlob";
import { generateReimbursementPDF } from "@/lib/fileHandlers/generateReimbursementPDF";
import { generateVolunteerAllowancePDF } from "@/lib/fileHandlers/generateVolunteerAllowancePDF";
import { shortReferenceId } from "@/lib/fileHandlers/referenceId";
import { useConvex } from "convex/react";
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
  const convex = useConvex();
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const getPdfBlobForReimbursement = async (
    id: Id<"reimbursements">,
  ): Promise<Blob | null> => {
    const reimbursement = await convex.query(
      api.reimbursements.queries.getReimbursement,
      { reimbursementId: id },
    );
    if (!reimbursement) return null;

    const organization = await convex.query(
      api.organizations.queries.getOrganization,
    );
    const signatureUrl = reimbursement.signatureStorageId
      ? await convex.query(api.reimbursements.queries.getFileUrl, {
          storageId: reimbursement.signatureStorageId,
        })
      : null;

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

    return generateReimbursementPDF(
      { ...reimbursement, organization, signatureUrl },
      receiptsWithUrls,
    );
  };

  const getPdfBlobForAllowance = async (
    allowance: Allowance,
  ): Promise<Blob | null> => {
    if (!allowance.signatureStorageId) return null;
    const signatureUrl = await convex.query(
      api.volunteerAllowance.queries.getSignatureUrl,
      { storageId: allowance.signatureStorageId },
    );
    return generateVolunteerAllowancePDF(
      { ...allowance, id: shortReferenceId(allowance._id) },
      signatureUrl,
    );
  };

  const handleDownloadReimbursement = async (id: Id<"reimbursements">) => {
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
          const id = key.slice(2) as Id<"reimbursements">;
          const blob = await getPdfBlobForReimbursement(id);
          if (blob) zip.file(`Erstattung_${shortReferenceId(id)}.pdf`, blob);
        } else if (key.startsWith("a:")) {
          const id = key.slice(2) as Id<"volunteerAllowance">;
          const allowance = allowances.find((a) => a._id === id);
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
    handleDownloadReimbursement,
    handleDownloadAllowance,
    handleBulkDownload,
  };
}
