"use client";

import { SelectProject } from "@/components/Selectors/SelectProject";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/bank-utils";
import type { Project } from "@/lib/db/types";

interface Props {
  projects: Project[];
  projectId: string | null;
  onProjectChange: (value: string | null) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
}

export function ProjectCurrencyFields({
  projects,
  projectId,
  onProjectChange,
  currency,
  onCurrencyChange,
}: Props) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
      <div className="w-full sm:w-[260px]">
        <Label>Projekt *</Label>
        <SelectProject
          value={projectId || ""}
          onValueChange={(value) => onProjectChange(value || null)}
          projects={projects}
        />
      </div>
      <div className="w-full sm:w-[120px]">
        <Label>Währung</Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((cur) => (
              <SelectItem key={cur} value={cur}>
                {cur} ({CURRENCY_SYMBOLS[cur]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
