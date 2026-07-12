import { toNet } from "@/lib/bank-utils";
import { createReimbursement } from "@/lib/server/reimbursements/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { EMPTY_DRAFT } from "./constants";
import { sumGross } from "./helpers";
import type { BankDetails, Draft, Receipt } from "./types";

export function useReimbursementForm(defaultBankDetails: BankDetails) {
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [bank, setBank] = useState(defaultBankDetails);
  const [currency, setCurrency] = useState("EUR");
  const [signature, setSignature] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addReceipt = () => {
    if (
      !draft.company ||
      !draft.desc ||
      !draft.gross ||
      !draft.file ||
      !draft.date
    ) {
      return toast.error(
        "Bitte Pflichtfelder ausfüllen (Firma, Beschreibung, Betrag, Belegdatum, Beleg)",
      );
    }
    if (draft.gross < 0) {
      return toast.error("Betrag muss positiv sein");
    }
    setReceipts([
      ...receipts,
      {
        receiptNumber: draft.number || undefined,
        receiptDate: draft.date,
        companyName: draft.company,
        description: draft.desc,
        netAmount: toNet(draft.gross, draft.tax),
        taxRate: draft.tax,
        grossAmount: draft.gross,
        fileStorageId: draft.file,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    toast.success(`Beleg ${receipts.length + 1} hinzugefügt`);
  };

  const removeReceipt = (index: number) =>
    setReceipts(receipts.filter((_, idx) => idx !== index));

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Bitte ein Projekt auswählen");
    if (receipts.length === 0)
      return toast.error("Bitte mindestens einen Beleg hinzufügen");
    if (!signature) return toast.error("Bitte unterschreiben");
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createReimbursement({
        projectId,
        amount: sumGross(receipts),
        ...bank,
        currency,
        signatureStorageId: signature,
        receipts,
      });
      toast.success("Erstattung eingereicht");
      router.push("/reimbursements");
    } catch {
      toast.error("Fehler beim Einreichen");
      setIsSubmitting(false);
    }
  };

  return {
    projectId,
    setProjectId,
    bank,
    setBank,
    currency,
    setCurrency,
    signature,
    setSignature,
    receipts,
    removeReceipt,
    draft,
    setDraft,
    addReceipt,
    isSubmitting,
    handleSubmit,
  };
}
