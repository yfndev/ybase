import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.members)) {
    return <AccessDenied title="Team" />;
  }

  return <MembersClient />;
}
