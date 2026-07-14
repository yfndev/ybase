import { requireUser } from "../../auth/session";
import { teams } from "../../db/collections";
import type { Team } from "../../db/types";

export async function getActiveTeams(): Promise<Team[]> {
  const user = await requireUser();
  return (await teams())
    .find({ organizationId: user.organizationId, isArchived: false })
    .sort({ _creationTime: 1 })
    .toArray();
}

export async function getArchivedTeams(): Promise<Team[]> {
  const user = await requireUser();
  return (await teams())
    .find({ organizationId: user.organizationId, isArchived: true })
    .sort({ _creationTime: 1 })
    .toArray();
}
