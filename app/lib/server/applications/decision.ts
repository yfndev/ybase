"use server";

import { z } from "zod";
import type { ApplicationDecision } from "../../applications/decisionEmail";
import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications, jobPostings, organizations } from "../../db/collections";
import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";

const inputSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["accepted", "rejected"]),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10_000),
});

const templateIds: Record<ApplicationDecision, number> = {
  accepted: BREVO_TEMPLATE_IDS.APPLICATION_ACCEPTED,
  rejected: BREVO_TEMPLATE_IDS.APPLICATION_REJECTED,
};

export async function sendApplicationDecision(
  input: z.input<typeof inputSchema>,
): Promise<void> {
  const parsed = inputSchema.parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (
    !isApplicationStatusTransitionAllowed(application.status, parsed.decision)
  ) {
    throw new Error("Dieser Statuswechsel ist nicht zulässig");
  }

  const [posting, organization] = await Promise.all([
    (await jobPostings()).findOne({
      _id: application.jobPostingId,
      organizationId: user.organizationId,
    }),
    (await organizations()).findOne({ _id: user.organizationId }),
  ]);
  if (!posting) throw new Error("Ausschreibung nicht gefunden");

  const delivery = await sendMail({
    to: [
      { email: application.applicantEmail, name: application.applicantName },
    ],
    templateId: templateIds[parsed.decision],
    subject: parsed.subject,
    params: {
      applicantName: application.applicantName ?? "",
      jobTitle: posting.title,
      organizationName: organization?.name ?? "",
      message: parsed.message,
    },
    tags: ["ybase", "application", `application-${parsed.decision}`],
  });
  if (delivery.status !== "sent") {
    throw new Error("E-Mail konnte nicht versendet werden");
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "status_changed",
    `${APPLICATION_STATUS_LABELS[application.status]} → ${APPLICATION_STATUS_LABELS[parsed.decision]}`,
    { fromStatus: application.status, toStatus: parsed.decision },
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: application.status,
    },
    {
      $set: { status: parsed.decision, updatedAt: entry.timestamp },
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  await addLog(
    user.organizationId,
    user._id,
    "application.status_change",
    application._id,
    entry.details,
  );
}
