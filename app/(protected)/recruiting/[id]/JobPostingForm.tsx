"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting, JobPostingStatus } from "@/lib/db/types";
import {
  type JobPostingFormValues,
  toJobPostingForm,
} from "@/lib/jobPostings/form";
import {
  JOB_POSTING_STATUS_LABELS,
  JOB_POSTING_STATUSES,
} from "@/lib/jobPostings/status";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { JobPostingBasicFields } from "./JobPostingBasicFields";
import { JobPostingContentFields } from "./JobPostingContentFields";
import { JobPostingTallySection } from "./JobPostingTallySection";

export function JobPostingForm({ posting }: { posting: JobPosting }) {
  const { update, setStatus } = useJobPostingMutations();
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

  const handleStatus = async (status: JobPostingStatus) => {
    try {
      await setStatus.mutateAsync({ jobPostingId: posting._id, status });
      toast.success("Status aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={posting.status}
            onValueChange={(value) => handleStatus(value as JobPostingStatus)}
          >
            <SelectTrigger id="jp-status" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_POSTING_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {JOB_POSTING_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      <JobPostingBasicFields values={values} onChange={patch} />
      <JobPostingContentFields values={values} onChange={patch} />
    </div>
  );
}
