import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { TeamsClient } from "./TeamsClient";

export default async function TeamsPage() {
  const session = await auth();
  if (
    !hasPermission(session?.user?.role, USER_PERMISSIONS.organizationStructure)
  ) {
    return <AccessDenied title="Struktur" />;
  }

  return <TeamsClient />;
}
