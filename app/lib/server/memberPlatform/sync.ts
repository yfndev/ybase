import type { MemberPlatformProfile } from "../../memberPlatform/suggestions";
import { users } from "../../db/collections";
import type { User } from "../../db/types";
import { YFN_ORGANIZATION } from "../../organization";
import { getMemberPlatformDb } from "./client";

export async function tryRefreshMemberPlatformProfile(
  member: User,
): Promise<User> {
  try {
    return await refreshMemberPlatformProfile(member);
  } catch (error) {
    console.error(
      `Member-platform refresh failed for YBase user ${member._id}`,
      error,
    );
    return member;
  }
}

async function refreshMemberPlatformProfile(member: User): Promise<User> {
  const email = member.email?.trim().toLowerCase();
  if (!email?.endsWith(`@${YFN_ORGANIZATION.domain}`)) return member;
  if (!member.memberPlatformUserId) return member;

  const platformDb = await getMemberPlatformDb();
  if (!platformDb) return member;

  const profile = await platformDb
    .collection<MemberPlatformProfile>("users")
    .findOne(
      { id: member.memberPlatformUserId, deletedAt: null },
      { projection: { _id: 0, id: 1, contact: 1 } },
    );
  if (!profile) return member;
  return persistMemberPlatformProfile(member, profile);
}

export async function persistMemberPlatformProfile(
  member: User,
  profile: MemberPlatformProfile,
): Promise<User> {
  const privateEmail = profile.contact?.email?.trim().toLowerCase();
  const phone = profile.contact?.phone?.trim();
  const syncedAt = Date.now();
  const unset: Partial<Record<"privateEmail" | "phone", "">> = {
    ...(privateEmail ? {} : { privateEmail: "" }),
    ...(phone ? {} : { phone: "" }),
  };
  const result = await (
    await users()
  ).updateOne(
    {
      _id: member._id,
      $or: [
        { memberPlatformUserId: { $exists: false } },
        { memberPlatformUserId: profile.id },
      ],
    },
    {
      $set: {
        memberPlatformUserId: profile.id,
        memberPlatformSyncedAt: syncedAt,
        ...(privateEmail ? { privateEmail } : {}),
        ...(phone ? { phone } : {}),
      },
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
  );
  if (result.matchedCount !== 1) return member;

  return {
    ...member,
    memberPlatformUserId: profile.id,
    memberPlatformSyncedAt: syncedAt,
    privateEmail,
    phone,
  };
}
