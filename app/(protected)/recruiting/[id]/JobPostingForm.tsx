"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import {
  type JobPostingFormValues,
  toJobPostingForm,
} from "@/lib/jobPostings/form";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { JobPostingApplications } from "./JobPostingApplications";
import { JobPostingBasicFields } from "./JobPostingBasicFields";
import { JobPostingContentFields } from "./JobPostingContentFields";
import { JobPostingStatusActions } from "./JobPostingStatusActions";
import { JobPostingTallySection } from "./JobPostingTallySection";

export function JobPostingForm({ posting }: { posting: JobPosting }) {
  const { update } = useJobPostingMutations();
  const [values, setValues] = useState<JobPostingFormValues>(() =>
    toJobPostingForm(posting),
  );

  const patch = (part: Partial<JobPostingFormValues>) =>
    setValues((current) => ({ ...current, ...part }));

  const handleSave = async () => {
    if (!values.title.trim() || !values.teamId) {
      toast.error("Titel und Team sind erforderlich");
      return;
    }
    try {
      await update.mutateAsync({ jobPostingId: posting._id, ...values });
      toast.success("Ausschreibung gespeichert");
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={values.title || "Ausschreibung"}
        showBackButton
        backUrl="/recruiting"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <JobPostingStatusActions posting={posting} />
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Speichern
        </Button>
      </div>

      <JobPostingTallySection posting={posting} />
      <JobPostingApplications posting={posting} />
      <JobPostingBasicFields values={values} onChange={patch} />
      <JobPostingContentFields values={values} onChange={patch} />
    </div>
  );
}
