"use client";

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
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  UNASSIGNED_APPLICATIONS,
} from "./applicationTable";

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
  return (
    <div className="flex flex-col gap-2 lg:flex-row">
      <Input
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        placeholder="Bewerbungen durchsuchen…"
        aria-label="Bewerbungen durchsuchen"
        className="lg:max-w-xs"
      />
      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ status: status as ApplicationFilters["status"] })
        }
      >
        <SelectTrigger aria-label="Status filtern" className="w-full lg:w-48">
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
      <Select
        value={filters.ownerId}
        onValueChange={(ownerId) => onChange({ ownerId })}
      >
        <SelectTrigger
          aria-label="Verantwortung filtern"
          className="w-full lg:w-56"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_APPLICATIONS}>
            Alle Verantwortlichen
          </SelectItem>
          <SelectItem value={UNASSIGNED_APPLICATIONS}>
            Nicht zugewiesen
          </SelectItem>
          {owners.map((owner) => (
            <SelectItem key={owner._id} value={owner._id}>
              {owner.name || owner.email || "Unbenannt"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
