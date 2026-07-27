import { createHash, randomBytes } from "node:crypto";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { teamDirectoryTokens } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";

const TOKEN_PREFIX = "ybase_team_";
const TOKEN_PATTERN = /^ybase_team_[A-Za-z0-9_-]{43}$/;

export function hashTeamDirectoryToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createTeamDirectoryToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export async function authenticateTeamDirectoryToken(
  token: string,
): Promise<string | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const storedToken = await (
    await teamDirectoryTokens()
  ).findOne(
    { tokenHash: hashTeamDirectoryToken(token) },
    { projection: { organizationId: 1 } },
  );
  return storedToken?.organizationId ?? null;
}

export async function rotateTeamDirectoryToken(): Promise<{
  token: string;
  rotatedAt: number;
}> {
  const user = await requirePermission(USER_PERMISSIONS.organizationSettings);
  const token = createTeamDirectoryToken();
  const rotatedAt = Date.now();

  await (
    await teamDirectoryTokens()
  ).updateOne(
    { organizationId: user.organizationId },
    {
      $set: {
        tokenHash: hashTeamDirectoryToken(token),
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
    "teamDirectoryToken.rotate",
    user.organizationId,
  );
  return { token, rotatedAt };
}
