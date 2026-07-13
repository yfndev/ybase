import {
  organizations,
  projects,
  receipts,
  reimbursements,
  travelDetails,
} from "@/lib/db/collections";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const doc = await (await reimbursements()).findOne({ _id: id });

  if (!doc) return Response.json({ valid: false, error: "Link ungültig" });
  if (!doc.isSharedLink)
    return Response.json({ valid: false, error: "Kein geteilter Link" });
  const isEditing = doc.status === "changes_requested";
  if (doc.amount > 0 && !isEditing)
    return Response.json({ valid: false, error: "Bereits eingereicht" });

  const organization = await (
    await organizations()
  ).findOne({
    _id: doc.organizationId,
  });
  const project = await (await projects()).findOne({ _id: doc.projectId });

  const travel =
    doc.type === "travel"
      ? await (await travelDetails()).findOne({ reimbursementId: id })
      : null;
  const receiptList = isEditing
    ? await (await receipts()).find({ reimbursementId: id }).toArray()
    : [];

  return Response.json({
    valid: true,
    type: doc.type,
    organizationName: organization?.name || "",
    projectName: project?.name || "",
    description: doc.description,
    invitedName: doc.invitedName,
    invitedEmail: doc.invitedEmail,
    travelDetails: travel,
    changesRequested: isEditing ? doc.reviewNote : undefined,
    submission: isEditing
      ? {
          name: doc.submitterName ?? doc.invitedName ?? "",
          email: doc.submitterEmail ?? doc.invitedEmail ?? "",
          iban: doc.iban,
          bic: doc.bic ?? "",
          accountHolder: doc.accountHolder,
          signatureStorageId: doc.signatureStorageId ?? null,
          receipts: receiptList.map(
            ({ _id, _creationTime, reimbursementId, ...receipt }) => receipt,
          ),
        }
      : undefined,
  });
}
