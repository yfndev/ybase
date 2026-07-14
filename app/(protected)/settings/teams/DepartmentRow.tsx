"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Department } from "@/lib/db/types";
import { Archive, Check, Pencil, X } from "lucide-react";

export function DepartmentRow({
  department,
  isEditing,
  editName,
  isArchiving,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
}: {
  department: Department;
  isEditing: boolean;
  editName: string;
  isArchiving: boolean;
  onEditNameChange: (value: string) => void;
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
            aria-label="Department-Name"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <button type="button" className="text-left" onClick={onStartEdit}>
            {department.name}
          </button>
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
                disabled={!editName.trim()}
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
