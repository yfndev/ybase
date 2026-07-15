import { createHash, randomBytes } from "node:crypto";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobFeedTokens } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";

const TOKEN_PREFIX = "ybase_feed_";
const TOKEN_PATTERN = /^ybase_feed_[A-Za-z0-9_-]{43}$/;

export function hashJobFeedToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createJobFeedToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export async function authenticateJobFeedToken(
  token: string,
): Promise<string | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const storedToken = await (
    await jobFeedTokens()
  ).findOne(
    { tokenHash: hashJobFeedToken(token) },
    { projection: { organizationId: 1 } },
  );
  return storedToken?.organizationId ?? null;
}

export async function rotateJobFeedToken(): Promise<{
  token: string;
  rotatedAt: number;
}> {
  const user = await requirePermission(USER_PERMISSIONS.organizationSettings);
  const token = createJobFeedToken();
  const rotatedAt = Date.now();

  await (
    await jobFeedTokens()
  ).updateOne(
    { organizationId: user.organizationId },
    {
      $set: {
        tokenHash: hashJobFeedToken(token),
        rotatedAt,
        rotatedBy: user._id,
      },
      $setOnInsert: {
        _id: newId(),
        _creationTime: rotatedAt,
        organizationId: user.organizationId,
      },
    },
    { upsert: true },
  );

  await addLog(
    user.organizationId,
    user._id,
    "jobFeedToken.rotate",
    user.organizationId,
  );
  return { token, rotatedAt };
}
