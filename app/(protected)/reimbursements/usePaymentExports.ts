import { buildPaymentReference } from "@/lib/fileHandlers/buildPaymentReference";
import { downloadBlob } from "@/lib/fileHandlers/downloadBlob";
import { generateFinomCSV } from "@/lib/fileHandlers/generateFinomCSV";
import { generateSEPAXML } from "@/lib/fileHandlers/generateSEPAXML";
import toast from "react-hot-toast";
import type { Reimbursement } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

export function usePaymentExports(
  reimbursements: Reimbursement[] | undefined,
  organizationName: string,
) {
  const buildApprovedPayments = () =>
    (reimbursements ?? [])
      .filter((r) => r.status === "approved" && r.iban && r.accountHolder)
      .map((r) => ({
        id: r._id,
        name: r.accountHolder,
        iban: r.iban,
        bic: r.bic,
        amount: r.amount,
        currency: r.currency ?? "EUR",
        reference: buildPaymentReference({
          reimbursementId: r._id,
          projectName: r.projectName,
          name: r.submitterName || r.creatorName,
        }),
      }));

  const handleFinomCsv = () => {
    const payments = buildApprovedPayments();
    if (payments.length === 0) {
      toast.error("Keine genehmigten Erstattungen mit IBAN vorhanden");
      return;
    }
    if (payments.length > 200) {
      toast.error("Finom erlaubt max. 200 Überweisungen pro Datei");
      return;
    }

    const blob = generateFinomCSV(payments);
    downloadBlob(blob, `Finom_Sammelueberweisung_${today()}.csv`);
    toast.success(`${payments.length} Überweisungen exportiert`);
  };

  const handleSepaXml = () => {
    const payments = buildApprovedPayments();
    if (payments.length === 0) {
      toast.error("Keine genehmigten Erstattungen mit IBAN vorhanden");
      return;
    }

    const blob = generateSEPAXML({ organizationName, payments });
    downloadBlob(blob, `SEPA_${today()}.xml`);
    toast.success(`${payments.length} Überweisungen exportiert`);
  };

  return { handleFinomCsv, handleSepaXml };
}
