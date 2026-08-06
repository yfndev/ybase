"use client";

import { DocumentContent } from "@/components/Documents/DocumentContent";
import { Button } from "@/components/ui/button";
import { getMembershipDocumentContent } from "@/lib/server/memberships/documentPublication";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

export function DocumentPreview({ versionId }: { versionId: string }) {
  const [content, setContent] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (content !== undefined) {
      setContent(undefined);
      return;
    }
    startTransition(async () => {
      try {
        const version = await getMembershipDocumentContent({ versionId });
        setContent(version.content);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Text konnte nicht geladen werden.",
        );
      }
    });
  }

  return (
    <div className="mt-3">
      <Button type="button" variant="ghost" size="sm" onClick={toggle}>
        {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {content === undefined ? "Text anzeigen" : "Text ausblenden"}
      </Button>
      {content !== undefined && <DocumentContent html={content} />}
    </div>
  );
}
