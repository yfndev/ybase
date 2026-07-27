import { ApplicationsPanel } from "@/components/Applications/ApplicationsPanel";
import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.recruiting)) {
    return <AccessDenied title="Bewerbungen" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bewerbungen" />
      <ApplicationsPanel />
    </div>
  );
}
