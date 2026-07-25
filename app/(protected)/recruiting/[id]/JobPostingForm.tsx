"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { DeleteJobPostingDialog } from "@/components/JobPostings/DeleteJobPostingDialog";
import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import {
  type JobPostingFormValues,
  toJobPostingForm,
} from "@/lib/jobPostings/form";
import { Loader2, Save, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { JobPostingApplications } from "./JobPostingApplications";
import { JobPostingBasicFields } from "./JobPostingBasicFields";
import { JobPostingContentFields } from "./JobPostingContentFields";
import { JobPostingStatusActions } from "./JobPostingStatusActions";

export function JobPostingForm({ posting }: { posting: JobPosting }) {
  const router = useRouter();
  const { update, generateForm, deletePosting } = useJobPostingMutations();
  const [values, setValues] = useState<JobPostingFormValues>(() =>
    toJobPostingForm(posting),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<"save" | "publish" | null>(
    null,
  );

  const patch = (part: Partial<JobPostingFormValues>) =>
    setValues((current) => ({ ...current, ...part }));

  const hasRequiredFields = () => {
    if (!values.title.trim() || !values.teamId) {
      toast.error("Titel und Team sind erforderlich");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!hasRequiredFields()) return;

    setActiveAction("save");
    try {
      await update.mutateAsync({ jobPostingId: posting._id, ...values });
      toast.success("Ausschreibung gespeichert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePublish = async () => {
    if (!hasRequiredFields()) return;

    setActiveAction("publish");
    try {
      await update.mutateAsync({ jobPostingId: posting._id, ...values });
      await generateForm.mutateAsync({ jobPostingId: posting._id });
      toast.success("Ausschreibung veröffentlicht");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Veröffentlichen",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePosting.mutateAsync({ jobPostingId: posting._id });
      toast.success("Ausschreibung gelöscht");
      setDeleteDialogOpen(false);
      router.replace("/recruiting");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Ausschreibung konnte nicht gelöscht werden",
      );
    }
  };

  const isBusy = activeAction !== null || deletePosting.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={values.title || "Ausschreibung"}
        showBackButton
        backUrl="/recruiting"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {posting.status === "draft" ? null : (
          <JobPostingStatusActions posting={posting} />
        )}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isBusy}
          >
            <Trash2 className="size-4" />
            Ausschreibung löschen
          </Button>
          <Button
            variant={posting.status === "draft" ? "outline" : "primary"}
            onClick={handleSave}
            disabled={isBusy}
            aria-busy={activeAction === "save"}
          >
            {activeAction === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {posting.status === "draft" ? "Entwurf speichern" : "Speichern"}
          </Button>
          {posting.status === "draft" ? (
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={isBusy}
              aria-busy={activeAction === "publish"}
            >
              {activeAction === "publish" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {posting.tallyFormError
                ? "Speichern & erneut veröffentlichen"
                : "Veröffentlichen"}
            </Button>
          ) : null}
        </div>
      </div>

      {posting.status === "draft" ? null : (
        <JobPostingApplications posting={posting} />
      )}
      <JobPostingBasicFields values={values} onChange={patch} />
      <JobPostingContentFields values={values} onChange={patch} />
      <DeleteJobPostingDialog
        postingTitle={posting.title}
        open={deleteDialogOpen}
        isDeleting={deletePosting.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
