"use client";

import { MultiSelect } from "@/components/Selectors/MultiSelect";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUS_LABELS } from "@/lib/applications/status";
import type { ApplicationStatus, User } from "@/lib/db/types";
import { ALL_APPLICATIONS, type ApplicationFilters } from "./applicationTable";

const STATUSES = Object.entries(APPLICATION_STATUS_LABELS) as [
  ApplicationStatus,
  string,
][];

interface Props {
  filters: ApplicationFilters;
  owners: User[];
  onChange: (patch: Partial<ApplicationFilters>) => void;
}

export function ApplicationsToolbar({ filters, owners, onChange }: Props) {
  const ownerOptions = owners.map((owner) => ({
    value: owner._id,
    label: owner.name || owner.email || "Unbenannt",
    description: owner.name ? owner.email : undefined,
    keywords: `${owner.name ?? ""} ${owner.email ?? ""}`,
  }));

  return (
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_minmax(10rem,14rem)]">
      <Input
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        placeholder="Bewerbungen durchsuchen…"
        aria-label="Bewerbungen durchsuchen"
        className="w-full"
      />
      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ status: status as ApplicationFilters["status"] })
        }
      >
        <SelectTrigger aria-label="Status filtern" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_APPLICATIONS}>Alle Status</SelectItem>
          {STATUSES.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <MultiSelect
        value={filters.ownerIds}
        onValueChange={(ownerIds) => onChange({ ownerIds })}
        options={ownerOptions}
        placeholder="Verantwortlich"
        searchPlaceholder="Person suchen …"
        renderValue={(selected, count) =>
          count === 1 ? selected[0]?.label : `${count} Verantwortliche`
        }
      />
    </div>
  );
}
