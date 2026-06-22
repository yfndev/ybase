import { requireRole } from "../../auth/session";
import { logs } from "../../db/collections";
import type { Log } from "../../db/types";

export async function getLogs(): Promise<Log[]> {
  const user = await requireRole("admin");
  return (await logs())
    .find({ organizationId: user.organizationId })
    .sort({ _creationTime: -1 })
    .limit(500)
    .toArray();
}
