"use client";

import { Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/lib/db/types";
import { JobPostingMoreMenu } from "./JobPostingMoreMenu";

interface Props {
  posting: JobPosting;
  activeAction: "save" | "publish" | null;
  disabled: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

export function JobPostingDraftActions({
  posting,
  activeAction,
  disabled,
  onSave,
  onPublish,
  onDelete,
}: Props) {
  return (
    <div className="ml-auto grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:justify-end">
      <Button
        variant="outline"
        className="min-w-0"
        onClick={onSave}
        disabled={disabled}
        aria-busy={activeAction === "save"}
      >
        {activeAction === "save" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Save />
        )}
        Speichern
      </Button>
      <Button
        variant="primary"
        className="min-w-0"
        onClick={onPublish}
        disabled={disabled}
        aria-busy={activeAction === "publish"}
      >
        {activeAction === "publish" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Send />
        )}
        Veröffentlichen
      </Button>
      <JobPostingMoreMenu
        posting={posting}
        disabled={disabled}
        onDelete={onDelete}
      />
    </div>
  );
}
