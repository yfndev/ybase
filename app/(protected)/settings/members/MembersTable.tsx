"use client";

import { PlaneTakeoff, UserRound } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import type { Department, Team, User } from "@/lib/db/types";
import { MemberRow } from "./MemberRow";
import { MembersTableHeader } from "./MembersTableHeader";
import { MembersTableSkeleton } from "./MembersTableSkeleton";

interface Props {
  members: User[];
  isLoading: boolean;
  teamsById: Map<string, Team>;
  departmentsById: Map<string, Department>;
  emptyTitle?: string;
  emptyDescription?: string;
  isDepartureEmptyState?: boolean;
  onSelect: (member: User) => void;
}

export function MembersTable({
  members,
  isLoading,
  teamsById,
  departmentsById,
  emptyTitle = "Keine Mitglieder gefunden",
  emptyDescription = "Passe Suche oder Filter an, um Mitglieder anzuzeigen.",
  isDepartureEmptyState,
  onSelect,
}: Props) {
  if (isLoading) {
    return <MembersTableSkeleton />;
  }

  if (!isLoading && members.length === 0) {
    const EmptyIcon = isDepartureEmptyState ? PlaneTakeoff : UserRound;

    return (
      <div className="rounded-md border py-12 text-center">
        <EmptyIcon
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-muted-foreground"
        />
        <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-2 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <MembersTableHeader />
        <TableBody>
          {members.map((member) => (
            <MemberRow
              key={member._id}
              member={member}
              teamsById={teamsById}
              departmentsById={departmentsById}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
