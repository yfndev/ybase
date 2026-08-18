"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MEMBERSHIP_DOCUMENT_LABELS } from "@/lib/members/documents";
import type { MembershipDocumentVersionSummary } from "@/lib/server/memberships/documentPublication";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { DOCUMENT_DATE_FORMAT } from "./documentForm";

export function DocumentsTable({
  versions,
}: {
  versions: MembershipDocumentVersionSummary[];
}) {
  const router = useRouter();

  function openDocument(versionId: string) {
    router.push(`/settings/documents/${versionId}`);
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        <FileText
          aria-hidden="true"
          className="mx-auto size-12 text-muted-foreground"
        />
        <h3 className="mt-4 text-lg font-semibold">Keine Unterlagen</h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Unterlage</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="pr-4">Veröffentlicht</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((version) => (
            <TableRow
              key={version.id}
              className="cursor-pointer"
              onClick={() => openDocument(version.id)}
            >
              <TableCell className="pl-4">
                <button
                  type="button"
                  className="font-medium outline-none hover:underline focus-visible:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDocument(version.id);
                  }}
                >
                  {version.title}
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {MEMBERSHIP_DOCUMENT_LABELS[version.kind]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {version.versionLabel}
              </TableCell>
              <TableCell className="pr-4 text-muted-foreground">
                {DOCUMENT_DATE_FORMAT.format(version.publishedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
