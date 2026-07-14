import { AccessDenied } from "@/components/Settings/AccessDenied";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { JobPostingEditor } from "./JobPostingEditor";

export default async function JobPostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.recruiting)) {
    return <AccessDenied title="Ausschreibungen" />;
  }

  const { id } = await params;
  return <JobPostingEditor id={id} />;
}
