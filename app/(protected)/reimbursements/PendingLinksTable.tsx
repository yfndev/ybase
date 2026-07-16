"use client";

import {
  Car,
  Check,
  Copy,
  Loader2,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { linkUrl } from "@/components/Reimbursements/shareModal/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatters/formatDate";
import {
  deleteSharedAllowanceLink,
  deleteSharedReimbursementLink,
} from "@/lib/server/reimbursements/sharing";
import type { PendingLink } from "./types";

type Props = {
  links: PendingLink[];
};

function linkDetails(link: PendingLink) {
  if (link.linkType === "allowance") {
    return {
      icon: <Users className="size-4 text-purple-500" />,
      label: "Ehrenamtspauschale",
    };
  }
  if (link.type === "travel") {
    return {
      icon: <Car className="size-4 text-blue-500" />,
      label: "Reisekostenerstattung",
    };
  }
  return {
    icon: <Receipt className="size-4 text-green-500" />,
    label: "Auslagenerstattung",
  };
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
            <TableHead className="w-24 text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => {
            const details = linkDetails(link);
            const isDeleting = deletingId === link._id;
            return (
              <TableRow key={`${link.linkType}:${link._id}`}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {details.icon}
                    {details.label}
                  </div>
                </TableCell>
                <TableCell className="max-w-56 truncate">
                  {link.projectName}
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {link.creatorName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(link._creationTime)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(link)}
                      aria-label={`${details.label}-Link kopieren`}
                      title="Link kopieren"
                    >
                      {copiedId === link._id ? (
                        <Check className="text-green-500" />
                      ) : (
                        <Copy />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(link)}
                      disabled={isDeleting}
                      aria-label={`${details.label}-Link löschen`}
                      title="Link löschen"
                    >
                      {isDeleting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
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
