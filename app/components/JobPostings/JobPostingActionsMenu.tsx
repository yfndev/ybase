"use client";

import { Archive, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verticalActionMenuClassNames as menu } from "@/components/ui/vertical-action-menu";
import type { JobPosting } from "@/lib/db/types";

export function JobPostingActionsMenu({
  posting,
  disabled,
  onArchive,
  onDelete,
}: {
  posting: JobPosting;
  disabled: boolean;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const canArchive = posting.status !== "archived";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={menu.trigger}
          disabled={disabled}
          aria-label={`Aktionen für ${posting.title} anzeigen`}
          title="Aktionen anzeigen"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={0} className={menu.content}>
        {canArchive ? (
          <DropdownMenuItem className={menu.item} onSelect={onArchive}>
            <Archive className="text-current" />
            Archivieren
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className={`${menu.item} ${menu.destructiveItem}`}
          onSelect={onDelete}
        >
          <Trash2 className="text-current" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
