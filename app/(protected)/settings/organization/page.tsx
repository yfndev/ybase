import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { getOrganization } from "@/lib/server/organizations/data";
import { OrganizationClient } from "./OrganizationClient";

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (
    !hasPermission(session?.user?.role, USER_PERMISSIONS.organizationSettings)
  ) {
    return <AccessDenied title="Organisation" />;
  }

  const organization = await getOrganization();

  return <OrganizationClient organization={organization} />;
}
