import { hasPermission } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { documentExecutions, documentVersions } from "@/lib/db/collections";
import { isUnavailableMemberStatus } from "@/lib/members/status";
import { presignNamedDownload } from "@/lib/s3/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ versionId: string }> },
) {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const isManager = hasPermission(actor.role, "manage_members");
  if (!isManager && isUnavailableMemberStatus(actor.memberStatus)) {
    return Response.json({ error: "Zugang gesperrt" }, { status: 403 });
  }
  const { versionId } = await context.params;
  const [version, execution] = await Promise.all([
    (await documentVersions()).findOne({
      _id: versionId,
      organizationId: actor.organizationId,
    }),
    isManager
      ? null
      : (await documentExecutions()).findOne({
          documentVersionId: versionId,
          userId: actor._id,
          organizationId: actor.organizationId,
        }),
  ]);
  if (!version || (!isManager && !execution)) {
    return Response.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const url = await presignNamedDownload(
    version.snapshotStorageKey,
    `${version.title}-${version.versionLabel}.pdf`,
  );
  return Response.redirect(url, 303);
}
