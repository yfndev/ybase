"use server";

import { z } from "zod";
import { requireRole, requireUser } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";
import { addLog } from "../logs";
import { getSignatureUrl } from "./data";

const MAX_VOLUNTEER_ALLOWANCE_EUR = 960;

export async function create(input: {
  projectId: string;
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  signatureStorageId: string;
}): Promise<string> {
  const user = await requireUser();
  const args = z
    .object({
      projectId: z.string(),
      amount: z.number(),
      iban: z.string(),
      bic: z.string().optional(),
      accountHolder: z.string(),
      activityDescription: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      taxYear: z.string().optional(),
      volunteerName: z.string(),
      volunteerStreet: z.string(),
      volunteerPlz: z.string(),
      volunteerCity: z.string(),
      signatureStorageId: z.string(),
    })
    .parse(input);

  if (args.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) {
    throw new Error(
      `Volunteer allowance cannot exceed ${MAX_VOLUNTEER_ALLOWANCE_EUR}€`,
    );
  }

  const _id = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    projectId: args.projectId,
    amount: args.amount,
    status: "pending",
    iban: args.iban,
    bic: args.bic,
    accountHolder: args.accountHolder,
    createdBy: user._id,
    activityDescription: args.activityDescription,
    startDate: args.startDate,
    endDate: args.endDate,
    taxYear: args.taxYear,
    volunteerName: args.volunteerName,
    volunteerStreet: args.volunteerStreet,
    volunteerPlz: args.volunteerPlz,
    volunteerCity: args.volunteerCity,
    signatureStorageId: args.signatureStorageId,
  });

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.create",
    _id,
    `${args.amount}€`,
  );
  return _id;
}

export async function getSignatureUrlAction(key: string): Promise<string> {
  return getSignatureUrl(key);
}

export async function approve(input: { id: string }): Promise<void> {
  const user = await requireRole("lead");
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) {
    throw new Error("Not found");
  }
  if (doc.status !== "pending") {
    throw new Error("Already processed");
  }
  if (doc.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) {
    throw new Error(
      `Cannot approve: amount exceeds ${MAX_VOLUNTEER_ALLOWANCE_EUR}€ legal limit`,
    );
  }

  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    {
      $set: {
        status: "approved",
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
    },
  );

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.approve",
    id,
    `${doc.amount}€`,
  );
}

export async function decline(input: {
  id: string;
  rejectionNote: string;
}): Promise<void> {
  const user = await requireRole("lead");
  const { id, rejectionNote } = z
    .object({ id: z.string(), rejectionNote: z.string() })
    .parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) {
    throw new Error("Not found");
  }
  if (doc.status !== "pending") {
    throw new Error("Already processed");
  }

  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    {
      $set: {
        status: "declined",
        rejectionNote,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
    },
  );

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.decline",
    id,
    rejectionNote,
  );
}

export async function remove(input: { id: string }): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) {
    throw new Error("Not found");
  }
  if (doc.createdBy !== user._id && user.role !== "admin") {
    throw new Error("Only the creator or an admin can delete");
  }

  if (doc.signatureStorageId) {
    await deleteObject(doc.signatureStorageId);
  }

  await (await volunteerAllowance()).deleteOne({ _id: id });

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.delete",
    id,
    `${doc.amount}€`,
  );
}
