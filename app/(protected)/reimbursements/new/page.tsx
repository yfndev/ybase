import { getAllProjects } from "@/lib/server/projects/data";
import { getOrganization } from "@/lib/server/organizations/data";
import { getUserBankDetails } from "@/lib/server/reimbursements/data";
import { NewReimbursementUI } from "./NewReimbursementUI";

export default async function ReimbursementFormPage() {
  const [defaultBankDetails, projects, organization] = await Promise.all([
    getUserBankDetails(),
    getAllProjects(),
    getOrganization(),
  ]);

  return (
    <NewReimbursementUI
      defaultBankDetails={defaultBankDetails}
      projects={projects}
      organizationName={organization.name}
    />
  );
}
