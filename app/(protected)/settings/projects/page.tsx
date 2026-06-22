import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return <AccessDenied title="Projekte" />;
  }

  return <ProjectsClient />;
}
