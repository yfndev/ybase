"use client";

import { Table, TableBody } from "@/components/ui/table";
import type { Department, Team, User } from "@/lib/db/types";
import { UserRound } from "lucide-react";
import type { ReactNode } from "react";
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
  emptyIcon?: ReactNode;
  onSelect: (member: User) => void;
}

export function MembersTable({
  members,
  isLoading,
  teamsById,
  departmentsById,
  emptyTitle = "Keine Mitglieder gefunden",
  emptyDescription = "Passe Suche oder Filter an, um Mitglieder anzuzeigen.",
  emptyIcon,
  onSelect,
}: Props) {
  if (isLoading) {
    return <MembersTableSkeleton />;
  }

  if (!isLoading && members.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        {emptyIcon ?? (
          <UserRound
            aria-hidden="true"
            className="mx-auto h-12 w-12 text-muted-foreground"
          />
        )}
        <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-2 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
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
