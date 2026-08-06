"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";

const SKELETON_ROWS = ["one", "two", "three", "four"];

export function DepartmentTargets({
  selected,
  onToggle,
  required,
}: {
  selected: string[];
  onToggle: (departmentId: string, checked: boolean) => void;
  required: boolean;
}) {
  const { departments, isLoading } = useDepartments();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Ziel-Departments{required ? "*" : " (optional)"}
      </p>
      {!required && (
        <p className="text-xs text-muted-foreground">
          Ohne Auswahl gilt die Unterlage für alle Mitglieder.
        </p>
      )}
      {isLoading && (
        <div className="grid gap-2 sm:grid-cols-2" aria-busy="true">
          <span className="sr-only">Departments werden geladen</span>
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {departments.map((department) => (
          <div key={department._id} className="flex items-center gap-2">
            <Checkbox
              id={`department-${department._id}`}
              checked={selected.includes(department._id)}
              onCheckedChange={(checked) =>
                onToggle(department._id, checked === true)
              }
            />
            <label
              htmlFor={`department-${department._id}`}
              className="text-sm leading-5"
            >
              {department.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
