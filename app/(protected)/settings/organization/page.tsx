import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { getOrganization } from "@/lib/server/organizations/data";
import { OrganizationClient } from "./OrganizationClient";

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return <AccessDenied title="Organisation" />;
  }

  const organization = await getOrganization();

  return <OrganizationClient organization={organization} />;
}
