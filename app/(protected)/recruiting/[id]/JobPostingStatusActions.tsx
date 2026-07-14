"use client";

import { JobPostingStatusBadge } from "@/components/JobPostings/JobPostingStatusBadge";
import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import { statusMeansClosed } from "@/lib/jobPostings/status";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type StatusMutation = {
  mutateAsync: (input: { jobPostingId: string }) => Promise<void>;
};

export function JobPostingStatusActions({ posting }: { posting: JobPosting }) {
  const { close, reopen, archive, retrySync } = useJobPostingMutations();
  const pending =
    close.isPending ||
    reopen.isPending ||
    archive.isPending ||
    retrySync.isPending;

  const run = async (mutation: StatusMutation, success: string) => {
    try {
      await mutation.mutateAsync({ jobPostingId: posting._id });
      toast.success(success);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      );
    }
  };

  const canArchive =
    posting.status === "published" || posting.status === "closed";
  const needsSync =
    Boolean(posting.tallyFormId) &&
    posting.status !== "draft" &&
    ((posting.tallyClosed ?? false) !== statusMeansClosed(posting.status) ||
      Boolean(posting.tallyFormError));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Status</span>
      <JobPostingStatusBadge status={posting.status} />
      {posting.status === "published" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(close, "Ausschreibung geschlossen")}
        >
          Schließen
        </Button>
      ) : null}
      {posting.status === "closed" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(reopen, "Ausschreibung wieder geöffnet")}
        >
          Wieder öffnen
        </Button>
      ) : null}
      {canArchive ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(archive, "Ausschreibung archiviert")}
        >
          Archivieren
        </Button>
      ) : null}
      {needsSync ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(retrySync, "Tally synchronisiert")}
        >
          Sync erneut versuchen
        </Button>
      ) : null}
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
    </div>
  );
}
