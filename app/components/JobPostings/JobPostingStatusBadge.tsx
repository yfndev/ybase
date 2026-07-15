import { Badge } from "@/components/ui/badge";
import type { JobPostingStatus } from "@/lib/db/types";
import { JOB_POSTING_STATUS_LABELS } from "@/lib/jobPostings/status";
import { cn } from "@/lib/utils";

const styles: Record<JobPostingStatus, { badge: string; dot: string }> = {
  draft: {
    badge: "border-border bg-muted text-foreground",
    dot: "bg-muted-foreground",
  },
  published: {
    badge: "border-primary bg-primary text-primary-foreground",
    dot: "bg-primary-foreground",
  },
  closed: {
    badge: "border-secondary bg-secondary text-secondary-foreground",
    dot: "bg-secondary-foreground",
  },
  archived: {
    badge: "border-border bg-accent text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function JobPostingStatusBadge({
  status,
  className,
}: {
  status: JobPostingStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 gap-1.5 border-2 px-2.5 py-0 font-semibold",
        styles[status].badge,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", styles[status].dot)}
      />
      {JOB_POSTING_STATUS_LABELS[status]}
    </Badge>
  );
}
