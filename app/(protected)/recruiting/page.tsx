import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { RecruitingClient } from "./RecruitingClient";

export default async function RecruitingPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.recruiting)) {
    return <AccessDenied title="Ausschreibungen" />;
  }

  return <RecruitingClient />;
}
