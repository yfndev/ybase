"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { DeleteJobPostingDialog } from "@/components/JobPostings/DeleteJobPostingDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import {
  type JobPostingFormValues,
  toJobPostingForm,
} from "@/lib/jobPostings/form";
import { JobPostingApplications } from "./JobPostingApplications";
import { JobPostingBasicFields } from "./JobPostingBasicFields";
import { JobPostingContentFields } from "./JobPostingContentFields";
import { JobPostingDraftActions } from "./JobPostingDraftActions";
import { JobPostingMoreMenu } from "./JobPostingMoreMenu";
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
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
      router.refresh();
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <JobPostingStatusActions posting={posting} />
        {posting.status === "draft" ? (
          <JobPostingDraftActions
            posting={posting}
            activeAction={activeAction}
            disabled={isBusy}
            onSave={handleSave}
            onPublish={handlePublish}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        ) : (
          <div className="ml-auto grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Button
              variant="primary"
              className="min-w-0"
              onClick={handleSave}
              disabled={isBusy}
              aria-busy={activeAction === "save"}
            >
              {activeAction === "save" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Speichern
            </Button>
            <JobPostingMoreMenu
              posting={posting}
              disabled={isBusy}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          </div>
        )}
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
