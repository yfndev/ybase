import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { DocumentsClient } from "./DocumentsClient";

export default async function MembershipDocumentsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.members)) {
    return <AccessDenied title="Unterlagen" />;
  }

  return <DocumentsClient />;
}
