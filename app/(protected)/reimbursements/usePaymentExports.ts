import { downloadBlob } from "@/lib/fileHandlers/downloadBlob";
import { generateFinomCSV } from "@/lib/fileHandlers/generateFinomCSV";
import { generateSEPAXML } from "@/lib/fileHandlers/generateSEPAXML";
import toast from "react-hot-toast";
import type { Allowance, Reimbursement, SelectionKey } from "./types";
import { buildApprovedPayments } from "./buildApprovedPayments";

const today = () => new Date().toISOString().slice(0, 10);

type Params = {
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  selected: Set<SelectionKey>;
  organizationName: string;
  clearSelection: () => void;
};

export function usePaymentExports({
  reimbursements,
  allowances,
  selected,
  organizationName,
  clearSelection,
}: Params) {
  const noPaymentsMessage = () =>
    selected.size > 0
      ? "Keine ausgewählten genehmigten Erstattungen mit IBAN vorhanden"
      : "Keine genehmigten Erstattungen mit IBAN vorhanden";

  const handleFinomCsv = () => {
    const payments = buildApprovedPayments({
      reimbursements,
      allowances,
      selected,
    });
    if (payments.length === 0) {
      toast.error(noPaymentsMessage());
      return;
    }
    if (payments.length > 200) {
      toast.error("Finom erlaubt max. 200 Überweisungen pro Datei");
      return;
    }

    const blob = generateFinomCSV(payments);
    downloadBlob(blob, `Finom_Sammelueberweisung_${today()}.csv`);
    toast.success(`${payments.length} Überweisungen exportiert`);
    if (selected.size > 0) clearSelection();
  };

  const handleSepaXml = () => {
    const payments = buildApprovedPayments({
      reimbursements,
      allowances,
      selected,
    });
    if (payments.length === 0) {
      toast.error(noPaymentsMessage());
      return;
    }

    const blob = generateSEPAXML({ organizationName, payments });
    downloadBlob(blob, `SEPA_${today()}.xml`);
    toast.success(`${payments.length} Überweisungen exportiert`);
    if (selected.size > 0) clearSelection();
  };

  return { handleFinomCsv, handleSepaXml };
}
