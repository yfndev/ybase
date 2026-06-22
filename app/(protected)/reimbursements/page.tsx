import { getAllProjects } from "@/lib/server/projects/data";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import { ReimbursementsClient } from "./ReimbursementsClient";

export default async function ReimbursementPage() {
  const [reimbursements, allowances, projects] = await Promise.all([
    getAllReimbursements(),
    getAll(),
    getAllProjects(),
  ]);

  return (
    <ReimbursementsClient
      reimbursements={reimbursements}
      allowances={allowances}
      projects={projects}
    />
  );
}
