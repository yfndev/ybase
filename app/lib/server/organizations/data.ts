import { requireUser } from "../../auth/session";
import { organizations } from "../../db/collections";
import type { Organization } from "../../db/types";

export type OrganizationByDomain =
  | { exists: false }
  | { exists: true; organizationName: string };

export type OrganizationSettings = {
  name: string;
  street: string;
  plz: string;
  city: string;
  accountingEmail: string;
  careOf: string;
  taxId: string;
};

type OrganizationRecord = Organization & { careOf?: string; taxId?: string };

export async function getOrganizationByDomain(): Promise<OrganizationByDomain> {
  const user = await requireUser();
  if (!user.email) return { exists: false };

  const domain = user.email.split("@")[1];
  if (!domain) return { exists: false };

  const organization = await (await organizations()).findOne({ domain });
  if (!organization) return { exists: false };

  return { exists: true, organizationName: organization.name };
}

export async function getOrganization(): Promise<OrganizationSettings> {
  const user = await requireUser();
  const org = (await (await organizations()).findOne({
    _id: user.organizationId,
  })) as OrganizationRecord | null;
  if (!org) throw new Error("Organization not found");

  return {
    name: org.name,
    street: org.street || "",
    plz: org.plz || "",
    city: org.city || "",
    accountingEmail: org.accountingEmail || "",
    careOf: org.careOf || "",
    taxId: org.taxId || "",
  };
}
