import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { listOrganizationUsers } from "@/lib/server/users/data";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.roles)) {
    return <AccessDenied title="Benutzer" />;
  }

  const users = await listOrganizationUsers();

  return <UsersClient users={users} />;
}
