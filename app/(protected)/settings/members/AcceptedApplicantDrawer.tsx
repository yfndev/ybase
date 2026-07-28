"use client";

import { DetailDrawer } from "@/components/Layout/DetailDrawer";
import { Badge } from "@/components/ui/badge";
import type { ApplicationWithFiles } from "@/lib/db/types";

export function AcceptedApplicantDrawer({
  application,
  onClose,
}: {
  application: ApplicationWithFiles;
  onClose: () => void;
}) {
  const displayName = application.applicantName || "Angenommene Person";

  return (
    <DetailDrawer
      title={displayName}
      description={`Nutzerverwaltung für ${displayName}`}
      ariaLabel={`Nutzerverwaltung für ${displayName}`}
      onClose={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="space-y-3 px-6 pt-10 pb-6">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Nutzerverwaltung
          </p>
          <div>
            <h2 className="text-[1.625rem] leading-tight font-semibold">
              {displayName}
            </h2>
            <p className="mt-1 truncate text-base text-muted-foreground">
              {application.applicantEmail || "Keine E-Mail hinterlegt"}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
          >
            Angenommen
          </Badge>
        </header>

        <div className="border-t px-6 py-6">
          <dl className="space-y-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                E-Mail
              </dt>
              <dd>{application.applicantEmail || "Nicht hinterlegt"}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                Ausschreibung
              </dt>
              <dd>{application.jobPostingTitle}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                YFN-Mail
              </dt>
              <dd>{application.yfnEmail || "Noch nicht vergeben"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </DetailDrawer>
  );
}
