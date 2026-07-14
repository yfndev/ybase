"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { useJobPosting } from "@/lib/client/jobPostings/hooks/useJobPosting";
import { JobPostingForm } from "./JobPostingForm";

export function JobPostingEditor({ id }: { id: string }) {
  const { jobPosting, isLoading } = useJobPosting(id);

  if (isLoading) {
    return <PageHeader showBackButton backUrl="/recruiting" />;
  }

  if (!jobPosting) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Ausschreibung"
          showBackButton
          backUrl="/recruiting"
        />
        <p className="text-muted-foreground">Ausschreibung nicht gefunden.</p>
      </div>
    );
  }

  return <JobPostingForm key={jobPosting._id} posting={jobPosting} />;
}
