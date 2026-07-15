"use client";

import { Users } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/db/types";
import { getInitials } from "@/lib/formatters/getInitials";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

interface MemberOption extends MultiSelectOption {
  member: User;
}

interface Props {
  id?: string;
  members: User[];
  value: string[];
  isLoading?: boolean;
  onValueChange: (value: string[]) => void;
  maxSelected?: number;
}

function memberName(member: User): string {
  return member.name?.trim() || member.email?.trim() || "Unbekanntes Mitglied";
}

function renderMemberOption(option: MemberOption) {
  const { member } = option;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={member.image} alt="" />
        <AvatarFallback className="text-xs font-semibold">
          {getInitials(member.name, member.email)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {option.label}
        </span>
        {option.description ? (
          <span className="block truncate text-xs text-muted-foreground">
            {option.description}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function renderSelectedMembers(options: MemberOption[], selectedCount: number) {
  return (
    <>
      {options.length > 0 ? (
        <span className="flex -space-x-2">
          {options.slice(0, 3).map(({ member }) => (
            <Avatar
              key={member._id}
              className="size-7 border-2 border-background"
            >
              <AvatarImage src={member.image} alt="" />
              <AvatarFallback className="text-[10px] font-semibold">
                {getInitials(member.name, member.email)}
              </AvatarFallback>
            </Avatar>
          ))}
        </span>
      ) : (
        <Users className="size-4 text-muted-foreground" />
      )}
      <span className="truncate">
        {selectedCount} {selectedCount === 1 ? "Person" : "Personen"} ausgewählt
      </span>
    </>
  );
}

export function SelectMembers({
  id,
  members,
  value,
  isLoading,
  onValueChange,
  maxSelected = 20,
}: Props) {
  const options = useMemo<MemberOption[]>(
    () =>
      members
        .filter(
          (member) =>
            member.memberStatus !== "offboarded" &&
            Boolean(member.email?.trim()),
        )
        .map((member) => ({
          value: member._id,
          label: memberName(member),
          description: member.name ? member.email : undefined,
          keywords: `${member.name ?? ""} ${member.email ?? ""} ${member.positionTitle ?? ""}`,
          member,
        }))
        .sort((first, second) => first.label.localeCompare(second.label, "de")),
    [members],
  );

  return (
    <MultiSelect
      id={id}
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder="Ansprechpartner auswählen"
      searchPlaceholder="Name oder E-Mail suchen"
      emptyMessage="Keine passenden Mitglieder gefunden."
      loadingMessage="Mitglieder werden geladen …"
      isLoading={isLoading}
      maxSelected={maxSelected}
      renderOption={renderMemberOption}
      renderValue={renderSelectedMembers}
    />
  );
}
