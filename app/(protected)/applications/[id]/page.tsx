import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { getApplication } from "@/lib/server/applications/management";
import { getOrganizationDomain } from "@/lib/server/organizations/data";
import { listMembers } from "@/lib/server/users/data";
import { ApplicationReview } from "./ApplicationReview";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.recruiting)) {
    return <AccessDenied title="Bewerbungen" />;
  }

  const { id } = await params;
  try {
    const [application, members, organizationDomain] = await Promise.all([
      getApplication(id),
      listMembers(),
      getOrganizationDomain(),
    ]);
    return (
      <ApplicationReview
        initialApplication={application}
        members={members}
        organizationDomain={organizationDomain}
      />
    );
  } catch {
    return (
      <div className="space-y-4">
        <PageHeader title="Bewerbung" showBackButton />
        <p className="text-muted-foreground">Bewerbung nicht gefunden.</p>
      </div>
    );
  }
}
