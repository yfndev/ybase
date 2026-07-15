"use server";

import { z } from "zod";
import { applications, users } from "../../db/collections";
import type { Application } from "../../db/types";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";

export async function updateApplicationManagement(input: {
  applicationId: string;
  ownerId: string | null;
  internalNotes: string;
  interviewAt: number | null;
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      ownerId: z.string().min(1).nullable(),
      internalNotes: z.string().max(10_000),
      interviewAt: z.number().int().positive().nullable(),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );

  if (parsed.ownerId) {
    const owner = await (
      await users()
    ).findOne({
      _id: parsed.ownerId,
      organizationId: user.organizationId,
      memberStatus: { $ne: "offboarded" },
    });
    if (!owner) throw new Error("Verantwortliche Person nicht verfügbar");
  }

  const nextNotes = parsed.internalNotes.trim();
  const details: string[] = [];
  if ((application.ownerId ?? null) !== parsed.ownerId)
    details.push("Verantwortung geändert");
  if ((application.internalNotes ?? "") !== nextNotes)
    details.push("Interne Notizen aktualisiert");
  if ((application.interviewAt ?? null) !== parsed.interviewAt)
    details.push(
      parsed.interviewAt
        ? "Interviewtermin aktualisiert"
        : "Interviewtermin entfernt",
    );
  if (details.length === 0) return;

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    details.join(" · "),
  );
  const set: Partial<Application> = {
    internalNotes: nextNotes,
    updatedAt: entry.timestamp,
  };
  const unset: Record<string, ""> = {};
  if (parsed.ownerId) set.ownerId = parsed.ownerId;
  else unset.ownerId = "";
  if (parsed.interviewAt) set.interviewAt = parsed.interviewAt;
  else unset.interviewAt = "";

  const result = await (
    await applications()
  ).updateOne(
    { _id: application._id, organizationId: user.organizationId },
    { $set: set, $unset: unset, $push: { history: entry } },
  );
  if (result.matchedCount !== 1) throw new Error("Bewerbung nicht gefunden");
  await addLog(
    user.organizationId,
    user._id,
    "application.management_update",
    application._id,
    details.join(", "),
  );
}
