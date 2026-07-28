"use client";

import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});
const SKELETON_ROWS = ["one", "two", "three", "four", "five"];

function ApplicationsTableSkeleton({
  showJobPosting,
}: {
  showJobPosting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border" aria-busy="true">
      <span className="sr-only">Bewerbungen werden geladen</span>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Bewerber:in</TableHead>
            {showJobPosting ? <TableHead>Ausschreibung</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead>
              {showJobPosting ? "Zuständig" : "Letzte Aktivität"}
            </TableHead>
            <TableHead className="pr-4">Eingang</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SKELETON_ROWS.map((row) => (
            <TableRow key={row}>
              <TableCell className="space-y-2 pl-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </TableCell>
              {showJobPosting ? (
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
              ) : null}
              <TableCell>
                <Skeleton className="h-7 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface Props {
  applications: ApplicationWithFiles[];
  ownersById: Map<string, User>;
  isLoading: boolean;
  showJobPosting: boolean;
  onSelect: (application: ApplicationWithFiles) => void;
}

export function ApplicationsTable({
  applications,
  ownersById,
  isLoading,
  showJobPosting,
  onSelect,
}: Props) {
  if (isLoading) {
    return <ApplicationsTableSkeleton showJobPosting={showJobPosting} />;
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        <Inbox className="mx-auto size-10 text-muted-foreground" />
        <h3 className="mt-3 font-semibold">Keine Bewerbungen gefunden</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Passe Suche oder Filter an, um Bewerbungen anzuzeigen.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Bewerber:in</TableHead>
            {showJobPosting ? <TableHead>Ausschreibung</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead>
              {showJobPosting ? "Zuständig" : "Letzte Aktivität"}
            </TableHead>
            <TableHead className="pr-4">Eingang</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const identity =
              application.status === "withdrawn"
                ? "Anonymisierte Bewerbung"
                : application.applicantName || application.applicantEmail;
            const responsiblePeople = application.ownerIds.flatMap(
              (ownerId) => {
                const owner = ownersById.get(ownerId);
                return owner ? [owner] : [];
              },
            );
            const responsibilityLabel =
              responsiblePeople.length === 0
                ? "–"
                : responsiblePeople
                    .map((owner) => owner.name || owner.email || "Unbenannt")
                    .join(", ");
            return (
              <TableRow
                key={application._id}
                className="cursor-pointer"
                onClick={() => onSelect(application)}
              >
                <TableCell className="pl-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 font-medium outline-none hover:underline focus-visible:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(application);
                    }}
                  >
                    {identity}
                  </button>
                  {application.applicantEmail ? (
                    <p className="text-xs text-muted-foreground">
                      {application.applicantEmail}
                    </p>
                  ) : null}
                </TableCell>
                {showJobPosting ? (
                  <TableCell>{application.jobPostingTitle}</TableCell>
                ) : null}
                <TableCell>
                  <ApplicationStatusBadge application={application} />
                </TableCell>
                {showJobPosting ? (
                  <TableCell className="max-w-56 truncate">
                    {responsibilityLabel}
                  </TableCell>
                ) : (
                  <TableCell className="text-muted-foreground">
                    {DATE_FORMAT.format(
                      application.updatedAt ?? application.submittedAt,
                    )}
                  </TableCell>
                )}
                <TableCell className="pr-4 text-muted-foreground">
                  {DATE_FORMAT.format(application.submittedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
