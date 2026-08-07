import { Badge } from "@/components/ui/badge";
import { MEMBERSHIP_DOCUMENT_LABELS } from "@/lib/members/documents";
import type { MembershipDocumentVersionSummary } from "@/lib/server/memberships/documentPublication";
import { Building2 } from "lucide-react";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DocumentDetails({
  version,
  departmentNames,
  active = false,
}: {
  version: MembershipDocumentVersionSummary;
  departmentNames: Map<string, string>;
  active?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{version.title}</h3>
        {active && <Badge variant="primary">Aktiv</Badge>}
        <Badge variant="outline">Version {version.versionLabel}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {MEMBERSHIP_DOCUMENT_LABELS[version.kind]} · veröffentlicht am{" "}
        {DATE_FORMAT.format(version.publishedAt)}
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Building2 aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        {version.targetDepartmentIds.length > 0
          ? version.targetDepartmentIds
              .map((id) => departmentNames.get(id) ?? id)
              .join(", ")
          : "Alle Departments"}
      </p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        SHA-256 {version.sha256.slice(0, 16)}…
      </p>
    </div>
  );
}
