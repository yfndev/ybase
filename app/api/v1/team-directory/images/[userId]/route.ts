import { departments, teams, users } from "@/lib/db/collections";
import { PUBLIC_MEMBER_STATUSES } from "@/lib/members/status";
import { getObjectBuffer } from "@/lib/s3/storage";
import { validateProfileImage } from "@/lib/server/profile/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

const NOT_FOUND_HEADERS = { "Cache-Control": "no-store" };

export async function GET(_request: Request, context: RouteContext) {
  const organizationId = process.env.YFN_TEAM_DIRECTORY_ORGANIZATION_ID?.trim();
  if (!organizationId) {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS });
  }

  const { userId } = await context.params;
  const member = await (
    await users()
  ).findOne({
    _id: userId,
    organizationId,
    memberStatus: { $in: [...PUBLIC_MEMBER_STATUSES] },
    publicProfileCompletedAt: { $exists: true },
    profileImageStorageKey: { $exists: true },
  });
  if (!member?.teamId || !member.profileImageStorageKey) {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS });
  }

  const team = await (
    await teams()
  ).findOne({
    _id: member.teamId,
    organizationId,
    isArchived: false,
  });
  if (!team) {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS });
  }
  const department = await (
    await departments()
  ).findOne({
    _id: team.departmentId,
    organizationId,
    isArchived: false,
  });
  if (!department) {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS });
  }

  try {
    const bytes = await getObjectBuffer(member.profileImageStorageKey);
    const contentType = validateProfileImage(bytes);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS });
  }
}
