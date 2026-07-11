import {
  approve as approveReimbursement,
  decline as declineReimbursement,
  deleteReimbursement,
} from "@/lib/server/reimbursements/actions";
import {
  approve as approveAllowance,
  decline as declineAllowance,
  remove as removeAllowance,
} from "@/lib/server/volunteerAllowance/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import type { RejectDialog } from "./types";

const CLOSED_DIALOG: RejectDialog = {
  open: false,
  type: "reimbursement",
  id: null,
  note: "",
};

export function useReimbursementActions() {
  const router = useRouter();
  const [rejectDialog, setRejectDialog] = useState<RejectDialog>(CLOSED_DIALOG);
  const [isRejecting, setIsRejecting] = useState(false);

  const run = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string,
  ) => {
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch {
      toast.error(failure);
    }
  };

  const handleReject = async () => {
    const note = rejectDialog.note.trim();
    if (!rejectDialog.id || !note || isRejecting) return;
    const id = rejectDialog.id;

    setIsRejecting(true);
    try {
      if (rejectDialog.type === "reimbursement") {
        await declineReimbursement({
          reimbursementId: id,
          rejectionNote: note,
        });
      } else {
        await declineAllowance({ id, rejectionNote: note });
      }
      toast.success("Abgelehnt");
      router.refresh();
      setRejectDialog(CLOSED_DIALOG);
    } catch {
      toast.error("Fehler beim Ablehnen");
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    rejectDialog,
    setRejectDialog,
    isRejecting,
    handleReject,
    handleOpenRejectDialog: (type: "reimbursement" | "allowance", id: string) =>
      setRejectDialog({ open: true, type, id, note: "" }),
    handleApproveReimbursement: (id: string) =>
      run(
        () => approveReimbursement({ reimbursementId: id }),
        "Genehmigt",
        "Fehler beim Genehmigen",
      ),
    handleApproveAllowance: (id: string) =>
      run(
        () => approveAllowance({ id }),
        "Genehmigt",
        "Fehler beim Genehmigen",
      ),
    handleDeleteReimbursement: (id: string) =>
      run(
        () => deleteReimbursement({ reimbursementId: id }),
        "Gelöscht",
        "Fehler beim Löschen",
      ),
    handleDeleteAllowance: (id: string) =>
      run(() => removeAllowance({ id }), "Gelöscht", "Fehler beim Löschen"),
  };
}
