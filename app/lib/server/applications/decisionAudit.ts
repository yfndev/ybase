import type { Application } from "../../db/types";
import { addLog } from "../logs";
import type { ParsedApplicationDecision } from "./decisionInput";

export async function recordDecisionLogs(input: {
  application: Application;
  decision: ParsedApplicationDecision;
  onboardingUserId?: string;
  organizationId: string;
  statusDetails: string;
  userId: string;
  workspaceUserId?: string;
}): Promise<void> {
  const writes = [
    addLog(
      input.organizationId,
      input.userId,
      "application.status_change",
      input.application._id,
      input.statusDetails,
    ),
  ];
  if (input.workspaceUserId && input.decision.decision === "accepted") {
    writes.push(
      addLog(
        input.organizationId,
        input.userId,
        "application.workspace_provisioned",
        input.application._id,
        input.decision.yfnEmail,
      ),
    );
  }
  if (input.onboardingUserId) {
    writes.push(
      addLog(
        input.organizationId,
        input.userId,
        "application.onboarding_linked",
        input.application._id,
      ),
    );
  }

  try {
    await Promise.all(writes);
  } catch (error) {
    console.error("application decision audit log failed", error);
  }
}
