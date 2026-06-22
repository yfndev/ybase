import {
  organizations,
  projects,
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
  if (doc.amount > 0)
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

  return Response.json({
    valid: true,
    type: doc.type,
    organizationName: organization?.name || "",
    projectName: project?.name || "",
    description: doc.description,
    travelDetails: travel,
  });
}
