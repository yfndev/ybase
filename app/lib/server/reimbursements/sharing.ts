"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import {
  projects,
  reimbursements,
  travelDetails,
  users,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";

const createLinkSchema = z.object({
  projectId: z.string(),
  type: z.enum(["expense", "travel"]),
  description: z.string().optional(),
  travelDetails: z
    .object({
      destination: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      allowFoodAllowance: z.boolean().optional(),
    })
    .optional(),
});

export async function createReimbursementLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createLinkSchema.parse(input);

  const reimbursementId = newId();
  await (
    await reimbursements()
  ).insertOne({
    _id: reimbursementId,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    projectId: args.projectId,
    amount: 0,
    type: args.type,
    status: "pending",
    iban: "",
    bic: "",
    accountHolder: "",
    createdBy: user._id,
    isSharedLink: true,
    description: args.description || "",
  });

  if (args.type === "travel" && args.travelDetails) {
    await (
      await travelDetails()
    ).insertOne({
      _id: newId(),
      _creationTime: Date.now(),
      reimbursementId,
      startDate: args.travelDetails.startDate || "",
      endDate: args.travelDetails.endDate || "",
      destination: args.travelDetails.destination || "",
      purpose: args.travelDetails.purpose || "",
      isInternational: false,
      allowFoodAllowance: args.travelDetails.allowFoodAllowance || false,
    });
  }

  return reimbursementId;
}

export async function deleteSharedReimbursementLink(input: {
  id: string;
}): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await reimbursements()).findOne({ _id: id });

  if (!doc) throw new Error("Not found");
  if (!doc.isSharedLink) throw new Error("Not a shared link");
  if (doc.amount > 0) throw new Error("Cannot delete submitted reimbursement");
  if (doc.organizationId !== user.organizationId)
    throw new Error("Unauthorized");

  if (doc.type === "travel") {
    await (await travelDetails()).deleteOne({ reimbursementId: id });
  }

  await (await reimbursements()).deleteOne({ _id: id });
}

export async function deleteSharedAllowanceLink(input: {
  id: string;
}): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });

  if (!doc) throw new Error("Not found");
  if (doc.signatureStorageId || doc.volunteerName)
    throw new Error("Cannot delete submitted allowance");
  if (doc.organizationId !== user.organizationId)
    throw new Error("Unauthorized");

  await (await volunteerAllowance()).deleteOne({ _id: id });
}

type PendingReimbursementLink = {
  _id: string;
  _creationTime: number;
  type: "expense" | "travel";
  projectName: string;
  description?: string;
  creatorName: string;
  linkType: "reimbursement";
};

type PendingAllowanceLink = {
  _id: string;
  _creationTime: number;
  projectName: string;
  activityDescription: string;
  creatorName: string;
  linkType: "allowance";
};

export async function getPendingSharedLinks(): Promise<{
  reimbursementLinks: PendingReimbursementLink[];
  allowanceLinks: PendingAllowanceLink[];
}> {
  const user = await requireUser();

  const pendingReimbursements = await (
    await reimbursements()
  )
    .find({
      organizationId: user.organizationId,
      isSharedLink: true,
      amount: 0,
    })
    .toArray();

  const allAllowances = await (await volunteerAllowance())
    .find({ organizationId: user.organizationId })
    .toArray();

  const pendingAllowances = allAllowances.filter(
    (allowance) => !allowance.signatureStorageId && !allowance.volunteerName,
  );

  const projectIds = [
    ...new Set([
      ...pendingReimbursements.map((reimbursement) => reimbursement.projectId),
      ...pendingAllowances.map((allowance) => allowance.projectId),
    ]),
  ];
  const projectList = await (await projects())
    .find({ _id: { $in: projectIds } })
    .toArray();
  const projectMap = new Map(
    projectList.map((project) => [project._id, project.name]),
  );

  const creatorIds = [
    ...new Set([
      ...pendingReimbursements.map((reimbursement) => reimbursement.createdBy),
      ...pendingAllowances.map((allowance) => allowance.createdBy),
    ]),
  ];
  const creators = await (await users())
    .find({ _id: { $in: creatorIds } })
    .toArray();
  const creatorMap = new Map(
    creators.map((creator) => [creator._id, creator.name]),
  );

  return {
    reimbursementLinks: pendingReimbursements.map((reimbursement) => ({
      _id: reimbursement._id,
      _creationTime: reimbursement._creationTime,
      type: reimbursement.type,
      projectName: projectMap.get(reimbursement.projectId) || "Unknown",
      description: reimbursement.description,
      creatorName: creatorMap.get(reimbursement.createdBy) || "Unknown",
      linkType: "reimbursement",
    })),
    allowanceLinks: pendingAllowances.map((allowance) => ({
      _id: allowance._id,
      _creationTime: allowance._creationTime,
      projectName: projectMap.get(allowance.projectId) || "Unknown",
      activityDescription: allowance.activityDescription,
      creatorName: creatorMap.get(allowance.createdBy) || "Unknown",
      linkType: "allowance",
    })),
  };
}
