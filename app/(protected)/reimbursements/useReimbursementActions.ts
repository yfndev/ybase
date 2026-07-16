import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteReimbursement } from "@/lib/server/reimbursements/deletion";
import {
  approve as approveReimbursement,
  decline as declineReimbursement,
  markAsPaid as markReimbursementAsPaid,
  requestChanges as requestReimbursementChanges,
} from "@/lib/server/reimbursements/review";
import { remove as removeAllowance } from "@/lib/server/volunteerAllowance/actions";
import {
  approve as approveAllowance,
  decline as declineAllowance,
  markAsPaid as markAllowanceAsPaid,
  requestChanges as requestAllowanceChanges,
} from "@/lib/server/volunteerAllowance/reviewActions";
import type { RejectDialog, SelectionKey } from "./types";

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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async (
    keys: SelectionKey[],
  ): Promise<SelectionKey[]> => {
    if (keys.length === 0 || isDeleting) return [];

    setIsDeleting(true);
    const results = await Promise.allSettled(
      keys.map((key) =>
        key.startsWith("r:")
          ? deleteReimbursement({ reimbursementId: key.slice(2) })
          : removeAllowance({ id: key.slice(2) }),
      ),
    );
    const deletedKeys = keys.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = keys.length - deletedKeys.length;

    if (deletedKeys.length > 0) {
      toast.success(
        deletedKeys.length === 1
          ? "Erstattung gelöscht"
          : `${deletedKeys.length} Erstattungen gelöscht`,
      );
      router.refresh();
    }
    if (failedCount > 0) {
      toast.error(
        failedCount === 1
          ? "Eine Erstattung konnte nicht gelöscht werden"
          : `${failedCount} Erstattungen konnten nicht gelöscht werden`,
      );
    }

    setIsDeleting(false);
    return deletedKeys;
  };

  return {
    rejectDialog,
    setRejectDialog,
    isRejecting,
    isDeleting,
    handleReview,
    handleDelete,
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
    handleMarkReimbursementAsPaid: (id: string) =>
      run(
        () => markReimbursementAsPaid({ reimbursementId: id }),
        "Als bezahlt markiert",
        "Zahlungsstatus konnte nicht aktualisiert werden",
      ),
    handleMarkAllowanceAsPaid: (id: string) =>
      run(
        () => markAllowanceAsPaid({ id }),
        "Als bezahlt markiert",
        "Zahlungsstatus konnte nicht aktualisiert werden",
      ),
  };
}
