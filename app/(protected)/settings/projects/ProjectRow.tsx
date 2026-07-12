"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Project } from "@/lib/db/types";
import { Archive, Check, Pencil, Trash2, X } from "lucide-react";

type EditValues = {
  name: string;
  travelDestination: string;
  travelPurpose: string;
};

export function ProjectRow({
  project,
  isEditing,
  editValues,
  isArchiving,
  onEditValuesChange,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onArchive,
  onDelete,
}: {
  project: Project;
  isEditing: boolean;
  editValues: EditValues;
  isArchiving: boolean;
  onEditValuesChange: (values: Partial<EditValues>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            autoFocus
            aria-label="Projektname"
            value={editValues.name}
            onChange={(e) => onEditValuesChange({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <button type="button" className="text-left" onClick={onStartEdit}>
            {project.name}
          </button>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            aria-label="Reiseziel"
            placeholder="z.B. Hamburg"
            value={editValues.travelDestination}
            onChange={(e) =>
              onEditValuesChange({ travelDestination: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <span className="text-muted-foreground">
            {project.travelDestination || "–"}
          </span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            aria-label="Reisezweck"
            placeholder="z.B. Team-Wochenende"
            value={editValues.travelPurpose}
            onChange={(e) =>
              onEditValuesChange({ travelPurpose: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <span className="text-muted-foreground">
            {project.travelPurpose || "–"}
          </span>
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
                disabled={!editValues.name.trim()}
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
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
