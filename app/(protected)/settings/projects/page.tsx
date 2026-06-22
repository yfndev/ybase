import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { getAllProjects, getArchivedProjects } from "@/lib/server/projects/data";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return <AccessDenied title="Projekte" />;
  }

  const [projects, archivedProjects] = await Promise.all([
    getAllProjects(),
    getArchivedProjects(),
  ]);

  return (
    <ProjectsClient projects={projects} archivedProjects={archivedProjects} />
  );
}
