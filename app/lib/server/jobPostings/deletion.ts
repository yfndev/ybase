"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import {
  applications,
  jobPostings,
  tallyWebhookEvents,
} from "../../db/collections";
import { deleteObject } from "../../s3/storage";
import { addLog } from "../logs";
import { createConfiguredTallyClient } from "../tally/client";
import { applicationFileStorageKey } from "../applications/fileStorage";
import { requireOwnedJobPosting } from "./access";

export async function deleteJobPosting(input: {
  jobPostingId: string;
}): Promise<void> {
  const { jobPostingId } = z
    .object({ jobPostingId: z.string().min(1) })
    .parse(input);
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const posting = await requireOwnedJobPosting(jobPostingId, user);
  const applicationRecords = await (
    await applications()
  )
    .find({
      organizationId: user.organizationId,
      jobPostingId: posting._id,
    })
    .toArray();

  if (posting.tallyWebhookId || posting.tallyFormId) {
    const tally = createConfiguredTallyClient();
    if (posting.tallyWebhookId) {
      await tally.deleteWebhook(posting.tallyWebhookId);
    }
    if (posting.tallyFormId) {
      await tally.deleteForm(posting.tallyFormId);
    }
  }

  const storageKeys = new Set(
    applicationRecords.flatMap((application) =>
      application.files.map(
        (file) =>
          file.storageKey ?? applicationFileStorageKey(application._id, file),
      ),
    ),
  );
  await Promise.all([...storageKeys].map((key) => deleteObject(key)));

  const applicationIds = applicationRecords.map(({ _id }) => _id);
  await Promise.all([
    (await applications()).deleteMany({
      organizationId: user.organizationId,
      jobPostingId: posting._id,
    }),
    (await tallyWebhookEvents()).deleteMany({
      $and: [
        {
          $or: [
            { organizationId: user.organizationId },
            { organizationId: { $exists: false } },
          ],
        },
        {
          $or: [
            { jobPostingId: posting._id },
            { applicationId: { $in: applicationIds } },
          ],
        },
      ],
    }),
  ]);

  const result = await (
    await jobPostings()
  ).deleteOne({
    _id: posting._id,
    organizationId: user.organizationId,
  });
  if (result.deletedCount !== 1) {
    throw new Error("Ausschreibung nicht gefunden");
  }

  await addLog(
    user.organizationId,
    user._id,
    "jobPosting.delete",
    posting._id,
    posting.title,
  );
}
