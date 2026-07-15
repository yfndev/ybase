import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications } from "../../db/collections";

export async function loadOwnedApplication(applicationId: string) {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const application = await (
    await applications()
  ).findOne({
    _id: applicationId,
    organizationId: user.organizationId,
  });
  if (!application) throw new Error("Bewerbung nicht gefunden");
  return { user, application };
}
