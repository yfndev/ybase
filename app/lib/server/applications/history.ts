import { newId } from "../../db/ids";
import type {
  ApplicationHistoryEntry,
  ApplicationStatus,
} from "../../db/types";

export function createApplicationHistoryEntry(
  actorUserId: string,
  type: ApplicationHistoryEntry["type"],
  details: string,
  status?: { fromStatus: ApplicationStatus; toStatus: ApplicationStatus },
): ApplicationHistoryEntry {
  return {
    _id: newId(),
    timestamp: Date.now(),
    actorUserId,
    type,
    details,
    ...status,
  };
}
