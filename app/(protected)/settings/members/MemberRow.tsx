"use client";

import { MemberStageBadge } from "@/components/Members/MemberStageBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Department, Team, User } from "@/lib/db/types";
import { getInitials } from "@/lib/formatters/getInitials";
import { memberStageForStatus } from "@/lib/members/stages";
import { profileAvatarUrl } from "@/lib/profile/avatar";

interface Props {
  member: User;
  teamsById: Map<string, Team>;
  departmentsById: Map<string, Department>;
  onSelect: (member: User) => void;
}

function roleLabel(member: User): string {
  if (member.boardMembership) {
    const boardRole = member.boardMembership.isChair ? "Vorsitz" : "Vorstand";
    return member.isSecondaryTeamLead ? `${boardRole}, Lead` : boardRole;
  }
  if (member.isTeamLead || member.isSecondaryTeamLead) return "Lead";
  return "—";
}

export function MemberRow({
  member,
  teamsById,
  departmentsById,
  onSelect,
}: Props) {
  const team = member.teamId ? teamsById.get(member.teamId) : undefined;
  const secondaryTeam = member.secondaryTeamId
    ? teamsById.get(member.secondaryTeamId)
    : undefined;
  const boardDepartment = member.boardMembership
    ? departmentsById.get(member.boardMembership.departmentId)
    : undefined;
  const teamDepartments = [team, secondaryTeam].flatMap((entry) => {
    const department = entry
      ? departmentsById.get(entry.departmentId)
      : undefined;
    return department ? [department.name] : [];
  });
  const departmentLabel =
    [
      ...new Set(
        member.boardMembership
          ? [boardDepartment?.name, ...teamDepartments].filter(
              (name) => name !== undefined,
            )
          : teamDepartments,
      ),
    ].join(", ") || "—";
  const teamLabel = member.boardMembership
    ? ["Vorstand", secondaryTeam?.name].filter(Boolean).join(", ")
    : [team, secondaryTeam]
        .flatMap((entry) => (entry ? [entry.name] : []))
        .join(", ") || "—";
  const role = roleLabel(member);
  const displayName = member.name || "Unbekanntes Mitglied";

  return (
    <TableRow className="cursor-pointer" onClick={() => onSelect(member)}>
      <TableCell className="pl-4">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage
              src={profileAvatarUrl(member)}
              alt={`Profilbild von ${displayName}`}
              className="object-cover"
            />
            <AvatarFallback className="text-xs">
              {getInitials(member.name, member.email)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="block max-w-56 truncate font-medium outline-none hover:underline focus-visible:underline"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(member);
            }}
          >
            {displayName}
          </button>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {member.email || "—"}
      </TableCell>
      <TableCell>
        <MemberStageBadge stage={memberStageForStatus(member.memberStatus)} />
      </TableCell>
      <TableCell>{departmentLabel}</TableCell>
      <TableCell>{teamLabel}</TableCell>
      <TableCell className="pr-4">{role}</TableCell>
    </TableRow>
  );
}
