"use server";

import { z } from "zod";
import { requireAuthenticatedUser, requireRole } from "../../auth/session";
import { organizations, projects, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Organization } from "../../db/types";
import { addLog } from "../logs";

type OrganizationUpdate = Partial<
  Pick<Organization, "name" | "street" | "plz" | "city" | "accountingEmail">
> & { careOf?: string; taxId?: string };

export async function initializeOrganization(input?: {
  organizationName?: string;
}): Promise<{ organizationId: string; isNew: boolean }> {
  const user = await requireAuthenticatedUser();
  const { organizationName } = z
    .object({ organizationName: z.string().optional() })
    .parse(input ?? {});

  if (user.organizationId) {
    return { organizationId: user.organizationId, isNew: false };
  }

  const domain = user.email?.split("@")[1]?.toLowerCase();
  if (!domain) throw new Error("Could not find a domain for this E-Mail");

  const existingOrg = await (await organizations()).findOne({ domain });
  if (existingOrg) {
    await (await users()).updateOne(
      { _id: user._id },
      { $set: { organizationId: existingOrg._id, role: "member" } },
    );
    return { organizationId: existingOrg._id, isNew: false };
  }

  const organizationId = newId();
  await (await organizations()).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: organizationName ?? `${domain} Organization`,
    domain,
    createdBy: user._id,
  });

  await (await projects()).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    name: "Allgemein",
    organizationId,
    isArchived: false,
    createdBy: user._id,
  });

  await (await users()).updateOne(
    { _id: user._id },
    { $set: { organizationId, role: "admin" } },
  );

  return { organizationId, isNew: true };
}

export async function updateOrganization(input: {
  name?: string;
  street?: string;
  plz?: string;
  city?: string;
  accountingEmail?: string;
  careOf?: string;
  taxId?: string;
}): Promise<void> {
  const user = await requireRole("admin");
  const args = z
    .object({
      name: z.string().optional(),
      street: z.string().optional(),
      plz: z.string().optional(),
      city: z.string().optional(),
      accountingEmail: z.string().optional(),
      careOf: z.string().optional(),
      taxId: z.string().optional(),
    })
    .parse(input);

  const org = await (await organizations()).findOne({
    _id: user.organizationId,
  });
  if (!org) throw new Error("Organization not found");

  const updates: OrganizationUpdate = {};
  if (args.name !== undefined) updates.name = args.name;
  if (args.street !== undefined) updates.street = args.street;
  if (args.plz !== undefined) updates.plz = args.plz;
  if (args.city !== undefined) updates.city = args.city;
  if (args.accountingEmail !== undefined)
    updates.accountingEmail = args.accountingEmail;
  if (args.careOf !== undefined) updates.careOf = args.careOf;
  if (args.taxId !== undefined) updates.taxId = args.taxId;

  await (await organizations()).updateOne(
    { _id: user.organizationId },
    { $set: updates },
  );

  await addLog(
    user.organizationId,
    user._id,
    "organization.update",
    user.organizationId,
    Object.keys(updates).join(", "),
  );
}
