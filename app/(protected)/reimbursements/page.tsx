import { getOrganization } from "@/lib/server/organizations/data";
import { getAllProjects } from "@/lib/server/projects/data";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import { ReimbursementsClient } from "./ReimbursementsClient";

export default async function ReimbursementPage() {
  const [reimbursements, allowances, projects, organization] =
    await Promise.all([
      getAllReimbursements(),
      getAll(),
      getAllProjects(),
      getOrganization(),
    ]);

  return (
    <ReimbursementsClient
      reimbursements={reimbursements}
      allowances={allowances}
      projects={projects}
      organizationName={organization.name}
    />
  );
}
