"use client";

import { Button } from "@/components/ui/button";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { MEMBERSHIP_DOCUMENT_LABELS } from "@/lib/members/documents";
import type { MembershipDocumentVersionSummary } from "@/lib/server/memberships/documentPublication";
import { DocumentPreview } from "./DocumentPreview";

export function DocumentVersionsList({
  versions,
  onDeactivate,
}: {
  versions: MembershipDocumentVersionSummary[];
  onDeactivate: (versionId: string) => Promise<void>;
}) {
  const { departments } = useDepartments();
  const names = new Map(
    departments.map((department) => [department._id, department.name]),
  );

  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Unterlagen veröffentlicht. Ohne Datenschutzerklärung, Satzung
        und Code of Conduct kann kein Mitglied das Onboarding starten.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {versions.map((version) => (
        <li
          key={version.id}
          className="rounded-xl border bg-card p-4 text-sm shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{version.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {MEMBERSHIP_DOCUMENT_LABELS[version.kind]} · Version{" "}
                {version.versionLabel} ·{" "}
                {version.isActive ? "aktiv" : "deaktiviert"}
              </p>
              {version.targetDepartmentIds.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Departments:{" "}
                  {version.targetDepartmentIds
                    .map((id) => names.get(id) ?? id)
                    .join(", ")}
                </p>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                SHA-256 {version.sha256.slice(0, 16)}…
              </p>
            </div>
            {version.isActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onDeactivate(version.id)}
              >
                Deaktivieren
              </Button>
            )}
          </div>
          <DocumentPreview versionId={version.id} />
        </li>
      ))}
    </ul>
  );
}
