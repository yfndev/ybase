"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Department, Team, User } from "@/lib/db/types";
import { UserRound } from "lucide-react";
import { MemberRow } from "./MemberRow";

interface Props {
  members: User[];
  isLoading: boolean;
  teamsById: Map<string, Team>;
  departmentsById: Map<string, Department>;
  onSelect: (member: User) => void;
}

export function MembersTable({
  members,
  isLoading,
  teamsById,
  departmentsById,
  onSelect,
}: Props) {
  if (!isLoading && members.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        <UserRound className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">
          Keine Teammitglieder gefunden
        </h3>
        <p className="mt-2 text-muted-foreground">
          Passe Suche oder Filter an, um Teammitglieder anzuzeigen.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>YFN-Mail</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6">Onboarding-Aufgaben</TableHead>
          </TableRow>
        </TableHeader>
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
