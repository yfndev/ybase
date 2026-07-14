"use client";

import { SelectDepartment } from "@/components/Selectors/SelectDepartment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Department, Team } from "@/lib/db/types";
import { Archive, Check, Pencil, X } from "lucide-react";

type EditValues = { name: string; departmentId: string };

export function TeamRow({
  team,
  departmentName,
  departments,
  isEditing,
  editValues,
  isArchiving,
  onEditValuesChange,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
}: {
  team: Team;
  departmentName: string;
  departments: Department[];
  isEditing: boolean;
  editValues: EditValues;
  isArchiving: boolean;
  onEditValuesChange: (values: Partial<EditValues>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: () => void;
  onArchive: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            autoFocus
            aria-label="Team-Name"
            value={editValues.name}
            onChange={(e) => onEditValuesChange({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <button type="button" className="text-left" onClick={onStartEdit}>
            {team.name}
          </button>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <SelectDepartment
            departments={departments}
            value={editValues.departmentId || undefined}
            onValueChange={(departmentId) =>
              onEditValuesChange({ departmentId })
            }
          />
        ) : (
          <span className="text-muted-foreground">{departmentName}</span>
        )}
      </TableCell>
      <TableCell className="pr-6">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Speichern"
                aria-label="Speichern"
                disabled={!editValues.name.trim() || !editValues.departmentId}
                onClick={onUpdate}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Abbrechen"
                aria-label="Abbrechen"
                onClick={onCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Bearbeiten"
                aria-label="Bearbeiten"
                onClick={onStartEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Archivieren"
                aria-label="Archivieren"
                disabled={isArchiving}
                onClick={onArchive}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
