import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";
import { getOrganization } from "@/lib/server/organizations/data";
import { getAllProjects } from "@/lib/server/projects/data";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { loadPendingSharedLinks } from "@/lib/server/reimbursements/sharingHelpers";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import { ReimbursementsClient } from "./ReimbursementsClient";

export default async function ReimbursementPage() {
  const reimbursementsPromise = getAllReimbursements();
  const allowancesPromise = getAll();
  const projectsPromise = getAllProjects();
  const organizationPromise = getOrganization();
  const user = await requireUser();
  const pendingLinksPromise = hasPermission(user.role, USER_PERMISSIONS.finance)
    ? loadPendingSharedLinks(user.organizationId)
    : Promise.resolve({ reimbursementLinks: [], allowanceLinks: [] });

  const [reimbursements, allowances, projects, organization, pendingLinks] =
    await Promise.all([
      reimbursementsPromise,
      allowancesPromise,
      projectsPromise,
      organizationPromise,
      pendingLinksPromise,
    ]);

  const sortedPendingLinks = [
    ...pendingLinks.reimbursementLinks,
    ...pendingLinks.allowanceLinks,
  ].sort((a, b) => b._creationTime - a._creationTime);

  return (
    <ReimbursementsClient
      reimbursements={reimbursements}
      allowances={allowances}
      pendingLinks={sortedPendingLinks}
      projects={projects}
      organizationName={organization.name}
      currentUserId={user._id}
    />
  );
}
