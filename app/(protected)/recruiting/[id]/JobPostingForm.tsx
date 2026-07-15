"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import {
  type JobPostingFormValues,
  toJobPostingForm,
} from "@/lib/jobPostings/form";
import { Loader2, Save, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { JobPostingApplications } from "./JobPostingApplications";
import { JobPostingBasicFields } from "./JobPostingBasicFields";
import { JobPostingContentFields } from "./JobPostingContentFields";
import { JobPostingStatusActions } from "./JobPostingStatusActions";
import { JobPostingTallySection } from "./JobPostingTallySection";

export function JobPostingForm({ posting }: { posting: JobPosting }) {
  const { update, generateForm } = useJobPostingMutations();
  const [values, setValues] = useState<JobPostingFormValues>(() =>
    toJobPostingForm(posting),
  );
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

  const isBusy = activeAction !== null;

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
                : "Speichern & veröffentlichen"}
            </Button>
          ) : null}
        </div>
      </div>

      <JobPostingTallySection posting={posting} />
      <JobPostingApplications posting={posting} />
      <JobPostingBasicFields values={values} onChange={patch} />
      <JobPostingContentFields values={values} onChange={patch} />
    </div>
  );
}
