import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.projects)) {
    return <AccessDenied title="Projekte" />;
  }

  return <ProjectsClient />;
}
