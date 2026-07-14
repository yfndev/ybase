import { Badge } from "@/components/ui/badge";
import type { JobPostingStatus } from "@/lib/db/types";
import { JOB_POSTING_STATUS_LABELS } from "@/lib/jobPostings/status";

const variants: Record<
  JobPostingStatus,
  "outline" | "primary" | "secondary" | "default"
> = {
  draft: "outline",
  published: "primary",
  closed: "secondary",
  archived: "default",
};

export function JobPostingStatusBadge({
  status,
}: {
  status: JobPostingStatus;
}) {
  return (
    <Badge variant={variants[status]}>
      {JOB_POSTING_STATUS_LABELS[status]}
    </Badge>
  );
}
