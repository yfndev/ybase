import { logs } from "../db/collections";
import { newId } from "../db/ids";

export async function addLog(
  organizationId: string,
  userId: string,
  action: string,
  entityId: string,
  details?: string,
): Promise<void> {
  await (await logs()).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    userId,
    action,
    entityId,
    details,
  });
}
