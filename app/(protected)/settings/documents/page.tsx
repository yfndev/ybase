import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { listMembershipDocumentVersions } from "@/lib/server/memberships/documentPublication";
import { DocumentsTable } from "./DocumentsTable";

export default async function MembershipDocumentsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.members)) {
    return <AccessDenied title="Unterlagen" />;
  }

  const versions = await listMembershipDocumentVersions();
  const activeVersions = versions.filter((version) => version.isActive);
  const archivedVersions = versions.filter((version) => !version.isActive);

  return (
    <div className="space-y-6">
      <PageHeader title="Unterlagen" />
      <DocumentsTable versions={activeVersions} />
      {archivedVersions.length > 0 && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-semibold">Frühere Fassungen</h2>
          <DocumentsTable versions={archivedVersions} />
        </section>
      )}
    </div>
  );
}
