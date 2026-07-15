import { applications, tallyWebhookEvents } from "../../db/collections";
import type { ApplicationHistoryEntry } from "../../db/types";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";
import { addLog } from "../logs";
import { applicationFileStorageKey } from "./fileStorage";
import { hashApplicationWithdrawalToken } from "./withdrawalToken";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function tokenHash(token: string): string | null {
  return TOKEN_PATTERN.test(token)
    ? hashApplicationWithdrawalToken(token)
    : null;
}

export async function canWithdrawApplication(token: string): Promise<boolean> {
  const hash = tokenHash(token);
  if (!hash) return false;
  return Boolean(
    await (
      await applications()
    ).findOne({ withdrawalTokenHash: hash }, { projection: { _id: 1 } }),
  );
}

export async function withdrawApplicationByToken(
  token: string,
  dependencies: { deleter?: typeof deleteObject } = {},
): Promise<void> {
  const hash = tokenHash(token);
  if (!hash) throw new Error("Rückzugslink ist ungültig");

  const collection = await applications();
  const application = await collection.findOne({ withdrawalTokenHash: hash });
  if (!application) throw new Error("Rückzugslink ist ungültig");

  const timestamp = Date.now();
  const history: ApplicationHistoryEntry = {
    _id: newId(),
    timestamp,
    type: "status_changed",
    actorUserId: "applicant",
    details: "Bewerbung zurückgezogen und anonymisiert",
    fromStatus: application.status,
    toStatus: "withdrawn",
  };
  const result = await collection.updateOne(
    { _id: application._id, withdrawalTokenHash: hash },
    {
      $set: {
        status: "withdrawn",
        applicantEmail: "",
        applicantEmailNormalized: `withdrawn:${application._id}`,
        fields: [],
        files: [],
        tallyEventId: `withdrawn:event:${application._id}`,
        tallySubmissionId: `withdrawn:submission:${application._id}`,
        tallyResponseId: `withdrawn:response:${application._id}`,
        tallyFormId: "",
        history: [history],
        withdrawnAt: timestamp,
        updatedAt: timestamp,
      },
      $unset: {
        applicantName: "",
        ownerId: "",
        internalNotes: "",
        interviewAt: "",
        withdrawalTokenHash: "",
      },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Rückzugslink ist nicht mehr gültig");
  }

  const storageKeys = new Set(
    application.files.map(
      (file) =>
        file.storageKey ?? applicationFileStorageKey(application._id, file),
    ),
  );
  const cleanup = [...storageKeys].map((key) =>
    (dependencies.deleter ?? deleteObject)(key),
  );
  await Promise.all([
    ...cleanup,
    (await tallyWebhookEvents()).deleteMany({ applicationId: application._id }),
  ]);
  await addLog(
    application.organizationId,
    "applicant",
    "application.withdrawn",
    application._id,
  );
}
