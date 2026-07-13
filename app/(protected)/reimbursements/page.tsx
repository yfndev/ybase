import { getOrganization } from "@/lib/server/organizations/data";
import { requireUser } from "@/lib/auth/session";
import { getAllProjects } from "@/lib/server/projects/data";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import { ReimbursementsClient } from "./ReimbursementsClient";

export default async function ReimbursementPage() {
  const [reimbursements, allowances, projects, organization, user] =
    await Promise.all([
      getAllReimbursements(),
      getAll(),
      getAllProjects(),
      getOrganization(),
      requireUser(),
    ]);

  return (
    <ReimbursementsClient
      reimbursements={reimbursements}
      allowances={allowances}
      projects={projects}
      organizationName={organization.name}
      currentUserId={user._id}
    />
  );
}
