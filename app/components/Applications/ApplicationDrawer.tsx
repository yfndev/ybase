"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { CalendarDays, Mail, UserRound } from "lucide-react";
import { ApplicationActionFooter } from "./ApplicationActionFooter";
import { ApplicationAnswers } from "./ApplicationAnswers";
import { ApplicationFiles } from "./ApplicationFiles";
import { ApplicationHistory } from "./ApplicationHistory";
import { ApplicationManagement } from "./ApplicationManagement";
import { DATE_TIME_FORMAT, isStandardField } from "./applicationPresentation";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

interface Props {
  application: ApplicationWithFiles;
  owners: User[];
  ownersById: Map<string, User>;
  onClose: () => void;
  onFilesChanged: () => Promise<unknown>;
}

export function ApplicationDrawer({
  application,
  owners,
  ownersById,
  onClose,
  onFilesChanged,
}: Props) {
  const standardFields = application.fields.filter(isStandardField);
  const individualFields = application.fields.filter(
    (field) => !isStandardField(field),
  );
  const withdrawn = application.status === "withdrawn";

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>
              {withdrawn
                ? "Anonymisierte Bewerbung"
                : application.applicantName || "Bewerbung"}
            </SheetTitle>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <SheetDescription>{application.jobPostingTitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Identität</p>
                <p className="text-sm font-medium">
                  {withdrawn
                    ? "Anonymisiert"
                    : application.applicantName || "Nicht angegeben"}
                </p>
              </div>
            </div>
            {!withdrawn ? (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <a
                    className="text-sm font-medium underline-offset-4 hover:underline"
                    href={`mailto:${application.applicantEmail}`}
                  >
                    {application.applicantEmail}
                  </a>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2 sm:col-span-2">
              <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Eingegangen</p>
                <p className="text-sm">
                  {DATE_TIME_FORMAT.format(application.submittedAt)}
                </p>
              </div>
            </div>
          </section>

          {!withdrawn ? (
            <ApplicationManagement application={application} owners={owners} />
          ) : null}
          <ApplicationAnswers
            title="Standardantworten"
            fields={standardFields}
          />
          <ApplicationAnswers
            title="Individuelle Antworten"
            fields={individualFields}
          />
          <ApplicationFiles
            files={application.files}
            onFilesChanged={onFilesChanged}
          />
          <ApplicationHistory
            application={application}
            ownersById={ownersById}
          />
        </div>

        <ApplicationActionFooter
          applicationId={application._id}
          status={application.status}
          applicantName={application.applicantName}
          jobPostingTitle={application.jobPostingTitle}
        />
      </SheetContent>
    </Sheet>
  );
}
