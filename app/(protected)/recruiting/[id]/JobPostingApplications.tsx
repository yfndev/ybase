"use client";

import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { APPLICATION_STATUS_LABELS } from "@/lib/applications/status";
import type { JobPosting } from "@/lib/db/types";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function JobPostingApplications({ posting }: { posting: JobPosting }) {
  const hasForm = Boolean(posting.tallyFormId);
  const { applications, isLoading } = useApplications(posting._id, hasForm);

  if (!hasForm) return null;

  return (
    <div className="space-y-3 rounded-lg border-2 p-4">
      <div>
        <h2 className="font-medium">Bewerbungen</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Wird geladen…" : `${applications.length} Bewerbung(en)`}
        </p>
      </div>

      {applications.length > 0 && (
        <ul className="divide-y">
          {applications.map((application) => (
            <li
              key={application._id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
