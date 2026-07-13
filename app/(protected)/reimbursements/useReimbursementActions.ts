import {
  approve as approveReimbursement,
  decline as declineReimbursement,
  deleteReimbursement,
  requestChanges as requestReimbursementChanges,
} from "@/lib/server/reimbursements/actions";
import { remove as removeAllowance } from "@/lib/server/volunteerAllowance/actions";
import {
  approve as approveAllowance,
  decline as declineAllowance,
  requestChanges as requestAllowanceChanges,
} from "@/lib/server/volunteerAllowance/reviewActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import type { RejectDialog } from "./types";

const CLOSED_DIALOG: RejectDialog = {
  open: false,
  action: "reject",
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

  const handleReview = async () => {
    const note = rejectDialog.note.trim();
    if (!rejectDialog.id || !note || isRejecting) return;
    const id = rejectDialog.id;

    setIsRejecting(true);
    try {
      if (rejectDialog.type === "reimbursement") {
        if (rejectDialog.action === "changes") {
          await requestReimbursementChanges({
            reimbursementId: id,
            reviewNote: note,
          });
        } else {
          await declineReimbursement({
            reimbursementId: id,
            rejectionNote: note,
          });
        }
      } else {
        if (rejectDialog.action === "changes") {
          await requestAllowanceChanges({ id, reviewNote: note });
        } else {
          await declineAllowance({ id, rejectionNote: note });
        }
      }
      toast.success(
        rejectDialog.action === "changes"
          ? "Änderungen angefordert"
          : "Abgelehnt",
      );
      router.refresh();
      setRejectDialog(CLOSED_DIALOG);
    } catch {
      toast.error(
        rejectDialog.action === "changes"
          ? "Änderungen konnten nicht angefordert werden"
          : "Fehler beim Ablehnen",
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    rejectDialog,
    setRejectDialog,
    isRejecting,
    handleReview,
    handleOpenReviewDialog: (
      action: "changes" | "reject",
      type: "reimbursement" | "allowance",
      id: string,
    ) => setRejectDialog({ open: true, action, type, id, note: "" }),
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
