"use client";

import { Button } from "@/components/ui/button";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import type { JobPosting } from "@/lib/db/types";
import { tallyFormEditorUrl } from "@/lib/tally/editor";
import { ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function JobPostingTallySection({ posting }: { posting: JobPosting }) {
  const { generateForm } = useJobPostingMutations();
  const formId = posting.tallyFormId;
  const canGenerate = posting.status === "draft";

  const handleGenerate = async () => {
    try {
      await generateForm.mutateAsync({ jobPostingId: posting._id });
      toast.success("Tally-Formular erstellt und veröffentlicht");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Tally-Einrichtung fehlgeschlagen",
      );
    }
  };

  return (
    <div className="space-y-3 rounded-lg border-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Bewerbungsformular</h2>
          <p className="text-sm text-muted-foreground">
            {formId
              ? "Formular ist mit dieser Ausschreibung verbunden."
              : "Erzeuge ein Tally-Formular aus der Organisationsvorlage."}
          </p>
        </div>
        {formId ? (
          <Button variant="outline" asChild>
            <a
              href={tallyFormEditorUrl(formId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              In Tally bearbeiten
            </a>
          </Button>
        ) : null}
      </div>

      {posting.tallyFormError ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {posting.tallyFormError}
        </p>
      ) : null}

      {canGenerate ? (
        <Button onClick={handleGenerate} disabled={generateForm.isPending}>
          {generateForm.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {posting.tallyFormError
            ? "Einrichtung erneut versuchen"
            : "Tally-Formular erstellen"}
        </Button>
      ) : null}
    </div>
  );
}
