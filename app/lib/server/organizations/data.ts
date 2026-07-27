import { requireUser } from "../../auth/session";
import { YFN_ORGANIZATION } from "../../organization";

export async function getOrganization() {
  await requireUser();
  return YFN_ORGANIZATION;
}

export async function getOrganizationDomain(): Promise<string> {
  await requireUser();
  return YFN_ORGANIZATION.domain;
}
