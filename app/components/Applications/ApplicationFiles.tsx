"use client";

import { Button } from "@/components/ui/button";
import type { ApplicationFileView } from "@/lib/db/types";
import { Download, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatFileSize } from "./applicationPresentation";

const FILE_STATUS = {
  pending: { label: "Import vorgemerkt", className: "text-amber-700" },
  importing: { label: "Wird importiert", className: "text-amber-700" },
  imported: { label: "Sicher gespeichert", className: "text-emerald-700" },
  rejected: { label: "Abgelehnt", className: "text-destructive" },
  failed: { label: "Import fehlgeschlagen", className: "text-destructive" },
} as const;

function FileRow({
  file,
  retrying,
  onRetry,
}: {
  file: ApplicationFileView;
  retrying: boolean;
  onRetry: (fileId: string) => void;
}) {
  const status = FILE_STATUS[file.status];
  const busy = file.status === "pending" || file.status === "importing";
  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {file.fieldLabel} · {formatFileSize(file.size)}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-xs ${status.className}`}>
          {busy ? <LoaderCircle className="size-3 animate-spin" /> : null}
          {status.label}
        </span>
        {file.status === "imported" ? (
          <Button asChild size="sm" variant="outline">
            <a href={`/api/application-files/${file._id}/download`}>
              <Download />
              Download
            </a>
          </Button>
        ) : null}
        {file.status === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={retrying}
            onClick={() => onRetry(file._id)}
          >
            <RefreshCw className={retrying ? "animate-spin" : undefined} />
            Erneut versuchen
          </Button>
        ) : null}
      </div>
      {file.error ? (
        <p className="mt-2 text-xs text-destructive">{file.error}</p>
      ) : null}
    </li>
  );
}

export function ApplicationFiles({
  files,
  onFilesChanged,
}: {
  files: ApplicationFileView[];
  onFilesChanged: () => Promise<unknown>;
}) {
  const [retryingFileId, setRetryingFileId] = useState<string | null>(null);

  async function retryFile(fileId: string) {
    setRetryingFileId(fileId);
    try {
      const response = await fetch(`/api/application-files/${fileId}/retry`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("retry failed");
      await onFilesChanged();
      toast.success("Dateiimport erneut gestartet");
    } catch {
      toast.error("Dateiimport konnte nicht gestartet werden");
    } finally {
      setRetryingFileId(null);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Anhänge</h3>
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <FileRow
              key={file._id}
              file={file}
              retrying={retryingFileId === file._id}
              onRetry={retryFile}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Keine Anhänge vorhanden.
        </p>
      )}
    </section>
  );
}
