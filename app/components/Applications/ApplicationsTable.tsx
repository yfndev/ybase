"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { ArrowDown, ArrowUp, Inbox } from "lucide-react";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface Props {
  applications: ApplicationWithFiles[];
  ownersById: Map<string, User>;
  isLoading: boolean;
  showJobPosting: boolean;
  sortDirection: "asc" | "desc";
  onSort: () => void;
  onSelect: (application: ApplicationWithFiles) => void;
}

export function ApplicationsTable({
  applications,
  ownersById,
  isLoading,
  showJobPosting,
  sortDirection,
  onSort,
  onSelect,
}: Props) {
  if (!isLoading && applications.length === 0) {
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
            <TableHead>Verantwortlich</TableHead>
            <TableHead className="pr-4">
              <Button variant="ghost" size="sm" onClick={onSort}>
                Eingang
                {sortDirection === "desc" ? <ArrowDown /> : <ArrowUp />}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const owner = application.ownerId
              ? ownersById.get(application.ownerId)
              : undefined;
            return (
              <TableRow
                key={application._id}
                className="cursor-pointer"
                onClick={() => onSelect(application)}
              >
                <TableCell className="pl-4">
                  <button
                    type="button"
                    className="block font-medium outline-none hover:underline focus-visible:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(application);
                    }}
                  >
                    {application.applicantName || application.applicantEmail}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {application.applicantEmail}
                  </p>
                </TableCell>
                {showJobPosting ? (
                  <TableCell>{application.jobPostingTitle}</TableCell>
                ) : null}
                <TableCell>
                  <ApplicationStatusBadge status={application.status} />
                </TableCell>
                <TableCell>{owner?.name || owner?.email || "–"}</TableCell>
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
