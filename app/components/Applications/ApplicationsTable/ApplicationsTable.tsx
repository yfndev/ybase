"use client";

import { Inbox } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { ApplicationRow } from "./ApplicationRow";
import { ApplicationsTableHeader } from "./ApplicationsTableHeader";
import { ApplicationsTableSkeleton } from "./ApplicationsTableSkeleton";

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
        <ApplicationsTableHeader showJobPosting={showJobPosting} />
        <TableBody>
          {applications.map((application) => (
            <ApplicationRow
              key={application._id}
              application={application}
              ownersById={ownersById}
              showJobPosting={showJobPosting}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
