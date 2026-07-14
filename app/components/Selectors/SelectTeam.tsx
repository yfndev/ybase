"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/lib/db/types";

interface Props {
  teams: Team[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
}

export function SelectTeam({ teams, value, onValueChange, id }: Props) {
  const active = teams.filter((team) => !team.isArchived);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Team wählen" />
      </SelectTrigger>
      <SelectContent>
        {active.map((team) => (
          <SelectItem key={team._id} value={team._id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
