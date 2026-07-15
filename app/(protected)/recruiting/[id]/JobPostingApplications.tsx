"use client";

import { Download, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { APPLICATION_STATUS_LABELS } from "@/lib/applications/status";
import type { ApplicationFileView, JobPosting } from "@/lib/db/types";

const FILE_STATUS = {
  pending: { label: "Import vorgemerkt", className: "text-amber-700" },
  importing: { label: "Wird importiert", className: "text-amber-700" },
  imported: { label: "Sicher gespeichert", className: "text-emerald-700" },
  rejected: { label: "Abgelehnt", className: "text-destructive" },
  failed: { label: "Import fehlgeschlagen", className: "text-destructive" },
} as const;

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ApplicationFileRow({
  file,
  isRetrying,
  onRetry,
}: {
  file: ApplicationFileView;
  isRetrying: boolean;
  onRetry: (fileId: string) => void;
}) {
  const status = FILE_STATUS[file.status];
  const isBusy = file.status === "pending" || file.status === "importing";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-md bg-muted/45 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {file.fieldLabel} · {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs ${status.className}`}
        >
          {isBusy ? <LoaderCircle className="size-3 animate-spin" /> : null}
          {status.label}
        </span>
        {file.status === "imported" ? (
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/application-files/${file._id}/download`}
              aria-label={`${file.fileName} herunterladen`}
            >
              <Download />
              Download
            </a>
          </Button>
        ) : null}
        {file.status === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isRetrying}
            onClick={() => onRetry(file._id)}
          >
            <RefreshCw className={isRetrying ? "animate-spin" : undefined} />
            Erneut versuchen
          </Button>
        ) : null}
      </div>
      {file.error ? (
        <p className="w-full pl-6 text-xs text-destructive">{file.error}</p>
      ) : null}
    </li>
  );
}

export function JobPostingApplications({ posting }: { posting: JobPosting }) {
  const hasForm = Boolean(posting.tallyFormId);
  const { applications, isLoading, refetch } = useApplications(
    posting._id,
    hasForm,
  );
  const [retryingFileId, setRetryingFileId] = useState<string | null>(null);

  async function retryFile(fileId: string) {
    setRetryingFileId(fileId);
    try {
      const response = await fetch(`/api/application-files/${fileId}/retry`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("retry failed");
      await refetch();
      toast.success("Dateiimport erneut gestartet");
    } catch {
      toast.error("Dateiimport konnte nicht gestartet werden");
    } finally {
      setRetryingFileId(null);
    }
  }

  if (!hasForm) return null;

  return (
    <div className="space-y-3 rounded-lg border-2 p-4">
      <div>
        <h2 className="font-medium">Bewerbungen</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Wird geladen…" : `${applications.length} Bewerbung(en)`}
        </p>
      </div>

      {applications.length > 0 ? (
        <ul className="divide-y">
          {applications.map((application) => (
            <li key={application._id} className="space-y-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {application.applicantName || application.applicantEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {application.applicantEmail}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full border px-2 py-0.5">
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(application._creationTime)}
                  </span>
                </div>
              </div>
              {application.files.length > 0 ? (
                <ul className="space-y-2" aria-label="Bewerbungsdateien">
                  {application.files.map((file) => (
                    <ApplicationFileRow
                      key={file._id}
                      file={file}
                      isRetrying={retryingFileId === file._id}
                      onRetry={retryFile}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
