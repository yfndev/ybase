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
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Alle Bewerbungen</h2>
          <p className="text-sm text-muted-foreground">
            Alle eingegangenen Bewerbungen ausschreibungsübergreifend.
          </p>
        </div>
        <ApplicationsPanel />
      </section>
    </div>
  );
}
