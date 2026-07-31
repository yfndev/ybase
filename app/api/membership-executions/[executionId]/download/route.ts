import { hasPermission } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { documentExecutions, documentVersions } from "@/lib/db/collections";
import { isUnavailableMemberStatus } from "@/lib/members/status";
import { presignNamedDownload } from "@/lib/s3/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ executionId: string }> },
) {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) {
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { executionId } = await context.params;
  const execution = await (
    await documentExecutions()
  ).findOne({
    _id: executionId,
    organizationId: actor.organizationId,
    status: "completed",
  });
  if (!execution) {
    return Response.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const manager = hasPermission(actor.role, "manage_members");
  if (
    !manager &&
    (execution.userId !== actor._id ||
      isUnavailableMemberStatus(actor.memberStatus))
  ) {
    return Response.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const storageKey =
    execution.completedPdfStorageKey ?? execution.paperEvidenceStorageKey;
  if (!storageKey) {
    return Response.json({ error: "Nachweis fehlt" }, { status: 404 });
  }
  const version = await (
    await documentVersions()
  ).findOne({
    _id: execution.documentVersionId,
    organizationId: actor.organizationId,
  });
  const title = version?.title ?? "Mitgliedschaftsdokument";
  return Response.redirect(
    await presignNamedDownload(storageKey, `${title}-Nachweis.pdf`),
    303,
  );
}
