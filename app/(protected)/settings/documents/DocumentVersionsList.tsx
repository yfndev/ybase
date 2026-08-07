"use client";

import { Button } from "@/components/ui/button";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import type { MembershipDocumentVersionSummary } from "@/lib/server/memberships/documentPublication";
import { Archive, ChevronRight, FileText, Loader2, Pencil } from "lucide-react";
import { DocumentDetails } from "./DocumentDetails";
import { DocumentPreview } from "./DocumentPreview";

type Props = {
  versions: MembershipDocumentVersionSummary[];
  loadingVersionId?: string;
  onEdit: (versionId: string) => Promise<void>;
  onDeactivate: (versionId: string) => Promise<void>;
};

export function DocumentVersionsList({
  versions,
  loadingVersionId,
  onEdit,
  onDeactivate,
}: Props) {
  const { departments } = useDepartments();
  const names = new Map(
    departments.map((department) => [department._id, department.name]),
  );
  const activeVersions = versions.filter((version) => version.isActive);
  const archivedVersions = versions.filter((version) => !version.isActive);

  if (versions.length === 0) {
    return (
      <div className="border-2 border-dashed px-6 py-12 text-center">
        <FileText
          aria-hidden="true"
          className="mx-auto size-9 text-muted-foreground"
        />
        <h3 className="mt-4 font-semibold">Noch keine Unterlagen</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Veröffentliche die benötigten Unterlagen, bevor neue Mitglieder das
          Onboarding starten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section aria-labelledby="active-documents-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="active-documents-heading" className="font-semibold">
            Aktive Unterlagen
          </h2>
          <span className="text-xs text-muted-foreground">
            {activeVersions.length}{" "}
            {activeVersions.length === 1 ? "Fassung" : "Fassungen"}
          </span>
        </div>
        {activeVersions.length > 0 ? (
          <ul className="divide-y border-2">
            {activeVersions.map((version) => (
              <DocumentRow
                key={version.id}
                version={version}
                departmentNames={names}
                isLoading={loadingVersionId === version.id}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            ))}
          </ul>
        ) : (
          <p className="border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
            Zurzeit ist keine Unterlage aktiv.
          </p>
        )}
      </section>

      {archivedVersions.length > 0 && (
        <details className="group border-t pt-4">
          <summary className="flex list-none cursor-pointer items-center gap-2 font-medium marker:hidden">
            <ChevronRight
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-90"
            />
            Frühere Fassungen
            <span className="text-xs font-normal text-muted-foreground">
              ({archivedVersions.length})
            </span>
          </summary>
          <ul className="mt-3 divide-y border bg-muted/20">
            {archivedVersions.map((version) => (
              <ArchivedDocumentRow
                key={version.id}
                version={version}
                departmentNames={names}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function DocumentRow({
  version,
  departmentNames,
  isLoading,
  onEdit,
  onDeactivate,
}: {
  version: MembershipDocumentVersionSummary;
  departmentNames: Map<string, string>;
  isLoading: boolean;
  onEdit: Props["onEdit"];
  onDeactivate: Props["onDeactivate"];
}) {
  return (
    <li className="border-l-4 border-l-primary bg-background p-5 text-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DocumentDetails
          version={version}
          departmentNames={departmentNames}
          active
        />
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {version.kind !== "optional_consent" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => void onEdit(version.id)}
            >
              {isLoading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Pencil aria-hidden="true" />
              )}
              Bearbeiten
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onDeactivate(version.id)}
          >
            <Archive aria-hidden="true" />
            Archivieren
          </Button>
        </div>
      </div>
      <DocumentPreview versionId={version.id} />
    </li>
  );
}

function ArchivedDocumentRow({
  version,
  departmentNames,
}: {
  version: MembershipDocumentVersionSummary;
  departmentNames: Map<string, string>;
}) {
  return (
    <li className="p-4 text-sm">
      <DocumentDetails version={version} departmentNames={departmentNames} />
      <DocumentPreview versionId={version.id} />
    </li>
  );
}
