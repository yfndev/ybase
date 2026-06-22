import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { listOrganizationUsers } from "@/lib/server/users/data";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return <AccessDenied title="Benutzer" />;
  }

  const users = await listOrganizationUsers();

  return <UsersClient users={users} />;
}
