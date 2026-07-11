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
  if (doc.volunteerName && doc.signatureStorageId)
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
  });
}
