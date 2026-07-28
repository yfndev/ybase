import { requireUser } from "@/lib/auth/session";
import { users } from "@/lib/db/collections";
import { getObjectBuffer } from "@/lib/s3/storage";
import { validateProfileImage } from "@/lib/server/profile/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

const PRIVATE_IMAGE_HEADERS = {
  "Cache-Control": "private, max-age=300",
  "X-Content-Type-Options": "nosniff",
};
const ERROR_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, context: RouteContext) {
  let actor: Awaited<ReturnType<typeof requireUser>>;
  try {
    actor = await requireUser();
  } catch {
    return new Response(null, { status: 401, headers: ERROR_HEADERS });
  }

  const { userId } = await context.params;
  const member = await (
    await users()
  ).findOne({
    _id: userId,
    organizationId: actor.organizationId,
    profileImageStorageKey: { $exists: true },
  });
  if (!member?.profileImageStorageKey) {
    return new Response(null, { status: 404, headers: ERROR_HEADERS });
  }

  try {
    const bytes = await getObjectBuffer(member.profileImageStorageKey);
    const contentType = validateProfileImage(bytes);
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...PRIVATE_IMAGE_HEADERS,
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return new Response(null, { status: 404, headers: ERROR_HEADERS });
  }
}
