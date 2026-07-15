import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/lib/db/types";
import { tallyFormEditorUrl } from "@/lib/tally/editor";
import { ExternalLink } from "lucide-react";

export function JobPostingTallySection({ posting }: { posting: JobPosting }) {
  const formId = posting.tallyFormId;

  return (
    <div className="space-y-3 rounded-lg border-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Bewerbungsformular</h2>
          <p className="text-sm text-muted-foreground">
            {formId
              ? "Formular ist mit dieser Ausschreibung verbunden."
              : "Beim Veröffentlichen wird ein Formular aus der Organisationsvorlage erzeugt."}
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
    </div>
  );
}
