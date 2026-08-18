"use client";

import { Inbox } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import type { MemberStage } from "@/lib/members/stages";
import { ApplicationRow } from "./ApplicationRow";
import { ApplicationsTableHeader } from "./ApplicationsTableHeader";
import { ApplicationsTableSkeleton } from "./ApplicationsTableSkeleton";

interface Props {
  applications: ApplicationWithFiles[];
  ownersById: Map<string, User>;
  isLoading: boolean;
  showJobPosting: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  stage?: MemberStage;
  onSelect: (application: ApplicationWithFiles) => void;
}

export function ApplicationsTable({
  applications,
  ownersById,
  isLoading,
  showJobPosting,
  emptyTitle = "Keine Bewerbungen gefunden",
  emptyDescription = "Passe Suche oder Filter an, um Bewerbungen anzuzeigen.",
  stage,
  onSelect,
}: Props) {
  if (isLoading) {
    return <ApplicationsTableSkeleton showJobPosting={showJobPosting} />;
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        <Inbox
          aria-hidden="true"
          className="mx-auto size-12 text-muted-foreground"
        />
        <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-2 text-muted-foreground">{emptyDescription}</p>
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
              stage={stage}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
