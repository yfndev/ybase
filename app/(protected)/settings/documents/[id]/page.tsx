import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { getActiveDepartments } from "@/lib/server/departments/data";
import { getMembershipDocument } from "@/lib/server/memberships/documentPublication";
import { DocumentDetail } from "./DocumentDetail";

export default async function MembershipDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.members)) {
    return <AccessDenied title="Unterlagen" />;
  }

  const { id } = await params;
  try {
    const [document, departments] = await Promise.all([
      getMembershipDocument({ versionId: id }),
      getActiveDepartments(),
    ]);
    const departmentNames = document.targetDepartmentIds.map(
      (departmentId) =>
        departments.find((department) => department._id === departmentId)
          ?.name ?? departmentId,
    );
    return (
      <DocumentDetail document={document} departmentNames={departmentNames} />
    );
  } catch {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Unterlage"
          showBackButton
          backUrl="/settings/documents"
        />
        <p className="text-muted-foreground">Unterlage nicht gefunden.</p>
      </div>
    );
  }
}
