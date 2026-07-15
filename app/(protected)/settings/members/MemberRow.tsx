"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Department, Team, User } from "@/lib/db/types";
import { getInitials } from "@/lib/formatters/getInitials";
import {
  memberStatusLabel,
  memberStatusVariant,
  teamOnboardingLabel,
  teamOnboardingVariant,
} from "./memberLabels";

interface Props {
  member: User;
  teamsById: Map<string, Team>;
  departmentsById: Map<string, Department>;
  onSelect: (member: User) => void;
}

export function MemberRow({
  member,
  teamsById,
  departmentsById,
  onSelect,
}: Props) {
  const team = member.teamId ? teamsById.get(member.teamId) : undefined;
  const department = team ? departmentsById.get(team.departmentId) : undefined;
  const status = member.memberStatus;
  const onboarding = member.teamOnboardingStatus;

  return (
    <TableRow className="cursor-pointer" onClick={() => onSelect(member)}>
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={member.image} />
            <AvatarFallback>
              {getInitials(member.name, member.email)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {member.name || "Unbekanntes Teammitglied"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {member.email || "—"}
      </TableCell>
      <TableCell>{department?.name ?? "—"}</TableCell>
      <TableCell>{team?.name ?? "—"}</TableCell>
      <TableCell>{member.positionTitle || "—"}</TableCell>
      <TableCell>
        <Badge variant={memberStatusVariant(status)}>
          {memberStatusLabel(status)}
        </Badge>
      </TableCell>
      <TableCell className="pr-6">
        <Badge variant={teamOnboardingVariant(onboarding)}>
          {teamOnboardingLabel(onboarding)}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
