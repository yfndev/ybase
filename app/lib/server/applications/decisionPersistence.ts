import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { applications } from "../../db/collections";
import type { Application } from "../../db/types";
import type { ParsedApplicationDecision } from "./decisionInput";
import { createApplicationHistoryEntry } from "./history";

export async function persistDecision(input: {
  application: Application;
  decision: ParsedApplicationDecision;
  organizationId: string;
  userId: string;
  workspaceUserId?: string;
  onboardingUserId?: string;
}): Promise<string> {
  const entry = createApplicationHistoryEntry(
    input.userId,
    "status_changed",
    `${APPLICATION_STATUS_LABELS[input.application.status]} → ${APPLICATION_STATUS_LABELS[input.decision.decision]}`,
    {
      fromStatus: input.application.status,
      toStatus: input.decision.decision,
    },
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: input.application._id,
      organizationId: input.organizationId,
      status: input.application.status,
      ...(input.workspaceUserId
        ? { workspaceProvisioningStatus: "provisioned" }
        : {}),
      ...(input.onboardingUserId
        ? {
            $or: [
              { onboardingUserId: { $exists: false } },
              { onboardingUserId: input.onboardingUserId },
            ],
          }
        : {}),
    },
    {
      $set: {
        status: input.decision.decision,
        updatedAt: entry.timestamp,
        ...(input.workspaceUserId
          ? { workspaceProvisioningStatus: "invited" as const }
          : {}),
        ...(input.onboardingUserId
          ? {
              onboardingUserId: input.onboardingUserId,
              onboardingLinkedAt: entry.timestamp,
              onboardingStartedAt: entry.timestamp,
              onboardingStartedBy: input.userId,
              cleanupEligibleAt: entry.timestamp,
            }
          : {}),
      },
      ...(input.workspaceUserId || input.onboardingUserId
        ? {
            $unset: {
              ...(input.workspaceUserId
                ? { workspaceProvisioningError: "" }
                : {}),
              ...(input.onboardingUserId ? { onboardingLinkError: "" } : {}),
            },
          }
        : {}),
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  return entry.details;
}
