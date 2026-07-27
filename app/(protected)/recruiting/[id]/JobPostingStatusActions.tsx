import type { JobPosting, JobPostingStatus } from "@/lib/db/types";
import { JOB_POSTING_STATUS_LABELS } from "@/lib/jobPostings/status";
import { cn } from "@/lib/utils";

const dotStyles: Record<JobPostingStatus, string> = {
  draft: "bg-muted-foreground",
  published: "bg-primary",
  closed: "bg-foreground",
  archived: "bg-muted-foreground/50",
};

export function JobPostingStatusActions({ posting }: { posting: JobPosting }) {
  return (
    <div className="flex min-h-9 items-center gap-2.5 text-sm">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          dotStyles[posting.status],
        )}
        aria-hidden="true"
      />
      <span className="font-semibold">
        {JOB_POSTING_STATUS_LABELS[posting.status]}
      </span>
    </div>
  );
}
