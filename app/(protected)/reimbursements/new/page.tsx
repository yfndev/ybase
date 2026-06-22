import { getAllProjects } from "@/lib/server/projects/data";
import { getUserBankDetails } from "@/lib/server/reimbursements/data";
import { NewReimbursementUI } from "./NewReimbursementUI";

export default async function ReimbursementFormPage() {
  const [defaultBankDetails, projects] = await Promise.all([
    getUserBankDetails(),
    getAllProjects(),
  ]);

  return (
    <NewReimbursementUI
      defaultBankDetails={defaultBankDetails}
      projects={projects}
    />
  );
}
