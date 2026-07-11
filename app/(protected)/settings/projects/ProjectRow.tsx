"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Project } from "@/lib/db/types";
import { Archive, Trash2 } from "lucide-react";

export function ProjectRow({
  project,
  isEditing,
  editName,
  isArchiving,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onArchive,
  onDelete,
}: {
  project: Project;
  isEditing: boolean;
  editName: string;
  isArchiving: boolean;
  onEditNameChange: (name: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <button type="button" className="text-left" onClick={onStartEdit}>
            {project.name}
          </button>
        )}
      </TableCell>
      <TableCell className="pr-6">
        <div className="flex items-center justify-end gap-1">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            title="Löschen"
            aria-label="Löschen"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
