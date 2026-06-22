import {
  logs,
  organizations,
  projects,
  receipts,
  reimbursements,
  signatureTokens,
  travelDetails,
  users,
  volunteerAllowance,
} from "@/lib/db/collections";

function testingEnabled(): boolean {
  return (
    process.env.IS_TEST === "true" && process.env.NODE_ENV !== "production"
  );
}

export async function POST(request: Request) {
  if (!testingEnabled()) {
    return new Response("Forbidden", { status: 403 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) return new Response("email required", { status: 400 });

  const domain = email.split("@")[1];
  const org = domain
    ? await (await organizations()).findOne({ domain })
    : null;

  if (org) {
    const orgReimbursements = await (await reimbursements())
      .find({ organizationId: org._id })
      .toArray();
    for (const reimbursement of orgReimbursements) {
      await (await receipts()).deleteMany({ reimbursementId: reimbursement._id });
      await (await travelDetails()).deleteMany({
        reimbursementId: reimbursement._id,
      });
    }
    await (await reimbursements()).deleteMany({ organizationId: org._id });
    await (await volunteerAllowance()).deleteMany({ organizationId: org._id });
    await (await projects()).deleteMany({ organizationId: org._id });
    await (await logs()).deleteMany({ organizationId: org._id });
    await (await signatureTokens()).deleteMany({ organizationId: org._id });
    await (await users()).deleteMany({ organizationId: org._id });
    await (await organizations()).deleteOne({ _id: org._id });
  }

  await (await users()).deleteOne({ email });

  return Response.json({ ok: true });
}
