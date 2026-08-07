"use client";

import { DocumentContent } from "@/components/Documents/DocumentContent";
import { Button } from "@/components/ui/button";
import { getMembershipDocumentContent } from "@/lib/server/memberships/documentPublication";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

export function DocumentPreview({ versionId }: { versionId: string }) {
  const [content, setContent] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (content !== undefined) {
      setIsOpen(true);
      return;
    }
    startTransition(async () => {
      try {
        const version = await getMembershipDocumentContent({ versionId });
        setContent(version.content);
        setIsOpen(true);
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
    <div className="mt-4 border-t pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {!isPending && (
          <ChevronDown
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
        {isOpen ? "Inhalt ausblenden" : "Inhalt anzeigen"}
      </Button>
      {isOpen && content !== undefined && (
        <DocumentContent
          html={content}
          className="mt-3 max-h-[60vh] overflow-y-auto border bg-muted/20 p-5 sm:p-6"
        />
      )}
    </div>
  );
}
