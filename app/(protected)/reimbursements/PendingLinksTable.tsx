"use client";

import { Check, Copy, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { linkUrl } from "@/components/Reimbursements/shareModal/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { verticalActionMenuClassNames as actionMenu } from "@/components/ui/vertical-action-menu";
import { formatDate } from "@/lib/formatters/formatDate";
import {
  deleteSharedAllowanceLink,
  deleteSharedReimbursementLink,
} from "@/lib/server/reimbursements/sharing";
import type { PendingLink } from "./types";

type Props = {
  links: PendingLink[];
};

function linkLabel(link: PendingLink) {
  if (link.linkType === "allowance") {
    return "Ehrenamtspauschale";
  }
  if (link.type === "travel") {
    return "Reisekostenerstattung";
  }
  return "Auslagenerstattung";
}

export function PendingLinksTable({ links }: Props) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopy = async (link: PendingLink) => {
    await navigator.clipboard.writeText(linkUrl(link.linkType, link._id));
    setCopiedId(link._id);
    toast.success("Link kopiert");
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (link: PendingLink) => {
    setDeletingId(link._id);
    try {
      if (link.linkType === "allowance") {
        await deleteSharedAllowanceLink({ id: link._id });
      } else {
        await deleteSharedReimbursementLink({ id: link._id });
      }
      toast.success("Link gelöscht");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler");
    } finally {
      setDeletingId(null);
    }
  };

  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center">
        <p className="font-medium">Keine offenen Links</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Neue Anforderungslinks erscheinen hier, bis die Erstattung eingereicht
          wurde.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table aria-label="Offene Links">
        <TableHeader>
          <TableRow>
            <TableHead>Anforderung</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead>Erstellt von</TableHead>
            <TableHead>Erstellt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => {
            const label = linkLabel(link);
            const isDeleting = deletingId === link._id;
            return (
              <TableRow key={`${link.linkType}:${link._id}`}>
                <TableCell className="font-medium">{label}</TableCell>
                <TableCell className="max-w-56 truncate">
                  {link.projectName}
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {link.creatorName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    {formatDate(link._creationTime)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={actionMenu.trigger}
                          aria-label={`Aktionen für ${label} anzeigen`}
                          title="Aktionen anzeigen"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        sideOffset={0}
                        className={actionMenu.content}
                      >
                        <DropdownMenuItem
                          className={actionMenu.item}
                          onSelect={() => void handleCopy(link)}
                        >
                          {copiedId === link._id ? (
                            <Check className="text-green-500" />
                          ) : (
                            <Copy />
                          )}
                          Link kopieren
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`${actionMenu.item} ${actionMenu.destructiveItem}`}
                          disabled={isDeleting}
                          onSelect={() => void handleDelete(link)}
                        >
                          {isDeleting ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                          Link löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
