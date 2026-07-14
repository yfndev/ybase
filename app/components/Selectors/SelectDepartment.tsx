"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/lib/db/types";

interface Props {
  departments: Department[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
}

export function SelectDepartment({
  departments,
  value,
  onValueChange,
  id,
}: Props) {
  const active = departments.filter((department) => !department.isArchived);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Department wählen" />
      </SelectTrigger>
      <SelectContent>
        {active.map((department) => (
          <SelectItem key={department._id} value={department._id}>
            {department.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
