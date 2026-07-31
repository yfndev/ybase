import type { Db } from "mongodb";
import { getClient } from "../../db/client";

export async function getMemberPlatformDb(): Promise<Db | null> {
  const databaseName = process.env.MEMBER_PLATFORM_MONGODB_DB?.trim();
  if (!databaseName) return null;

  return (await getClient()).db(databaseName);
}
