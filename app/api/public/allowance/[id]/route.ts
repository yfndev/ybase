import {
  organizations,
  projects,
  volunteerAllowance,
} from "@/lib/db/collections";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const doc = await (await volunteerAllowance()).findOne({ _id: id });

  if (!doc)
    return Response.json({ valid: false, error: "Dieser Link ist ungültig." });
  if (!doc.isSharedLink)
    return Response.json({ valid: false, error: "Dieser Link ist ungültig." });
  const isEditing = doc.status === "changes_requested";
  if (doc.volunteerName && doc.signatureStorageId && !isEditing)
    return Response.json({
      valid: false,
      error: "Dieses Formular wurde bereits eingereicht.",
    });

  const organization = await (
    await organizations()
  ).findOne({
    _id: doc.organizationId,
  });
  const project = await (await projects()).findOne({ _id: doc.projectId });

  return Response.json({
    valid: true,
    organizationName: organization?.name || "",
    organizationStreet: organization?.street || "",
    organizationPlz: organization?.plz || "",
    organizationCity: organization?.city || "",
    projectName: project?.name || "",
    activityDescription: doc.activityDescription,
    startDate: doc.startDate,
    endDate: doc.endDate,
    invitedName: doc.invitedName,
    invitedEmail: doc.invitedEmail,
    changesRequested: isEditing ? doc.reviewNote : undefined,
    submission: isEditing
      ? {
          volunteerName: doc.volunteerName,
          submitterEmail: doc.submitterEmail ?? doc.invitedEmail ?? "",
          volunteerStreet: doc.volunteerStreet,
          volunteerPlz: doc.volunteerPlz,
          volunteerCity: doc.volunteerCity,
          amount: doc.amount,
          iban: doc.iban,
          bic: doc.bic ?? "",
          accountHolder: doc.accountHolder,
          taxYear: doc.taxYear ?? "",
          signatureStorageId: doc.signatureStorageId ?? null,
        }
      : undefined,
  });
}
