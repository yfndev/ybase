import {
  projects,
  reimbursements,
  travelDetails,
  users,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { z } from "zod";
import type { createLinkSchema } from "./validators";

export type PendingReimbursementLink = {
  _id: string;
  _creationTime: number;
  type: "expense" | "travel";
  projectName: string;
  creatorName: string;
  linkType: "reimbursement";
};

export type PendingAllowanceLink = {
  _id: string;
  _creationTime: number;
  projectName: string;
  activityDescription: string;
  creatorName: string;
  linkType: "allowance";
};

type LinkActor = { _id: string; organizationId: string };

export async function insertReimbursementLink(
  reimbursementId: string,
  user: LinkActor,
  args: z.infer<typeof createLinkSchema>,
): Promise<void> {
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
    requestedExternally: true,
    invitedName: args.invitedName,
    invitedEmail: args.invitedEmail,
  });

  if (args.type !== "travel" || !args.travelDetails) return;

  await (
    await travelDetails()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    reimbursementId,
    startDate: "",
    endDate: "",
    destination: args.travelDetails.destination || "",
    purpose: args.travelDetails.purpose || "",
    isInternational: false,
    allowFoodAllowance: args.travelDetails.allowFoodAllowance || false,
  });
}

export async function loadPendingSharedLinks(organizationId: string): Promise<{
  reimbursementLinks: PendingReimbursementLink[];
  allowanceLinks: PendingAllowanceLink[];
}> {
  const pendingReimbursements = await (await reimbursements())
    .find({ organizationId, isSharedLink: true, amount: 0 })
    .toArray();

  const allAllowances = await (await volunteerAllowance())
    .find({ organizationId })
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
