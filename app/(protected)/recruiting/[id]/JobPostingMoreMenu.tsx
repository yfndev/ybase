"use client";

import {
  Archive,
  CircleStop,
  Ellipsis,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verticalActionMenuClassNames as menu } from "@/components/ui/vertical-action-menu";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import { statusMeansClosed } from "@/lib/jobPostings/status";
import { tallyFormEditorUrl } from "@/lib/tally/constants";

type StatusMutation = {
  mutateAsync: (input: { jobPostingId: string }) => Promise<void>;
};

export function JobPostingMoreMenu({
  posting,
  disabled,
  onDelete,
  showTallyAction = true,
}: {
  posting: JobPosting;
  disabled: boolean;
  onDelete: () => void;
  showTallyAction?: boolean;
}) {
  const router = useRouter();
  const { close, reopen, archive, retrySync } = useJobPostingMutations();
  const pending =
    close.isPending ||
    reopen.isPending ||
    archive.isPending ||
    retrySync.isPending;
  const canArchive =
    posting.status === "published" || posting.status === "closed";
  const needsSync =
    Boolean(posting.tallyFormId) &&
    posting.status !== "draft" &&
    ((posting.tallyClosed ?? false) !== statusMeansClosed(posting.status) ||
      Boolean(posting.tallyFormError));
  const run = async (mutation: StatusMutation, success: string) => {
    try {
      await mutation.mutateAsync({ jobPostingId: posting._id });
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={menu.trigger}
          disabled={disabled || pending}
          aria-label="Weitere Aktionen"
          title="Weitere Aktionen"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Ellipsis />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className={menu.content}>
        {showTallyAction && posting.tallyFormId ? (
          <DropdownMenuItem className={menu.item} asChild>
            <a
              href={tallyFormEditorUrl(posting.tallyFormId)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="text-current" />
              Tally bearbeiten
            </a>
          </DropdownMenuItem>
        ) : null}
        {posting.status === "published" ? (
          <DropdownMenuItem
            className={menu.item}
            onSelect={() => void run(close, "Ausschreibung geschlossen")}
          >
            <CircleStop className="text-current" />
            Schließen
          </DropdownMenuItem>
        ) : null}
        {posting.status === "closed" ? (
          <DropdownMenuItem
            className={menu.item}
            onSelect={() => void run(reopen, "Ausschreibung wieder geöffnet")}
          >
            <RotateCcw className="text-current" />
            Wieder öffnen
          </DropdownMenuItem>
        ) : null}
        {needsSync ? (
          <DropdownMenuItem
            className={menu.item}
            onSelect={() => void run(retrySync, "Tally synchronisiert")}
          >
            <RefreshCw className="text-current" />
            Tally erneut synchronisieren
          </DropdownMenuItem>
        ) : null}
        {canArchive ? (
          <DropdownMenuItem
            className={menu.item}
            onSelect={() => void run(archive, "Ausschreibung archiviert")}
          >
            <Archive className="text-current" />
            Archivieren
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className={`${menu.item} ${menu.destructiveItem}`}
          onSelect={onDelete}
        >
          <Trash2 className="text-current" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
