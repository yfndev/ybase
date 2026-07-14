"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { berlinToday, isDeadlinePassed } from "../../jobPostings/deadline";
import { statusMeansClosed } from "../../jobPostings/status";
import { requireOwnedJobPosting } from "./access";
import { applyStatusTransition, syncTallyClosed } from "./tallySync";

const idSchema = z.object({ jobPostingId: z.string() });

async function loadOwnedForAction(input: { jobPostingId: string }) {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const { jobPostingId } = idSchema.parse(input);
  const posting = await requireOwnedJobPosting(
    jobPostingId,
    user.organizationId,
  );
  return { user, posting };
}

export async function closeJobPosting(input: {
  jobPostingId: string;
}): Promise<void> {
  const { user, posting } = await loadOwnedForAction(input);
  if (posting.status !== "published") {
    throw new Error(
      "Nur veröffentlichte Ausschreibungen können geschlossen werden",
    );
  }
  const result = await applyStatusTransition({
    posting,
    nextStatus: "closed",
    action: "jobPosting.close",
    trigger: "Manuell",
    actorUserId: user._id,
  });
  if (result.syncError) throw new Error(result.syncError);
}

export async function reopenJobPosting(input: {
  jobPostingId: string;
}): Promise<void> {
  const { user, posting } = await loadOwnedForAction(input);
  if (posting.status !== "closed") {
    throw new Error(
      "Nur geschlossene Ausschreibungen können wieder geöffnet werden",
    );
  }
  if (isDeadlinePassed(posting.deadline, berlinToday())) {
    throw new Error(
      "Die Frist liegt in der Vergangenheit",
    );
  }
  const result = await applyStatusTransition({
    posting,
    nextStatus: "published",
    action: "jobPosting.reopen",
    trigger: "Manuell",
    actorUserId: user._id,
  });
  if (result.syncError) throw new Error(result.syncError);
}

export async function archiveJobPosting(input: {
  jobPostingId: string;
}): Promise<void> {
  const { user, posting } = await loadOwnedForAction(input);
  if (posting.status !== "published" && posting.status !== "closed") {
    throw new Error(
      "Nur veröffentlichte oder geschlossene Ausschreibungen können archiviert werden",
    );
  }
  const result = await applyStatusTransition({
    posting,
    nextStatus: "archived",
    action: "jobPosting.archive",
    trigger: "Manuell",
    actorUserId: user._id,
  });
  if (result.syncError) throw new Error(result.syncError);
}

export async function retryTallySync(input: {
  jobPostingId: string;
}): Promise<void> {
  const { user, posting } = await loadOwnedForAction(input);
  const result = await syncTallyClosed(
    posting,
    statusMeansClosed(posting.status),
    user._id,
  );
  if (result.syncError) throw new Error(result.syncError);
}
