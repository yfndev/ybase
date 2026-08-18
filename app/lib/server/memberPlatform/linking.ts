import {
  type MemberPlatformProfile,
  suggestMemberPlatformProfile,
} from "../../memberPlatform/suggestions";
import { LINKABLE_MEMBER_PLATFORM_STATES } from "../../memberPlatform/states";
import { users } from "../../db/collections";
import type { User } from "../../db/types";
import { YFN_ORGANIZATION } from "../../organization";
import { getMemberPlatformDb } from "./client";

export interface MemberPlatformLinkOption {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface MemberPlatformLinkingData {
  profile?: MemberPlatformLinkOption;
}

export async function getMemberPlatformLinkingData(
  member: User,
): Promise<MemberPlatformLinkingData | null> {
  if (!isEligibleForMemberPlatformLinking(member)) return null;
  const platformDb = await getMemberPlatformDb();
  if (!platformDb) return null;

  const [profiles, states, claims] = await Promise.all([
    platformDb
      .collection<MemberPlatformProfile>("users")
      .find({ deletedAt: null })
      .project<MemberPlatformProfile>({
        _id: 0,
        id: 1,
        person: 1,
        contact: 1,
        auth: 1,
        images: 1,
      })
      .toArray(),
    platformDb
      .collection("user-states")
      .find({ current: { $in: [...LINKABLE_MEMBER_PLATFORM_STATES] } })
      .project<{ userId: string }>({ _id: 0, userId: 1 })
      .toArray(),
    (await users())
      .find({ memberPlatformUserId: { $exists: true } })
      .project<{ memberPlatformUserId: string }>({
        _id: 0,
        memberPlatformUserId: 1,
      })
      .toArray(),
  ]);
  const linkableIds = new Set(states.map(({ userId }) => userId));
  const claimedIds = new Set(
    claims.map(({ memberPlatformUserId }) => memberPlatformUserId),
  );
  const availableProfiles = profiles.filter(
    ({ id }) => linkableIds.has(id) && !claimedIds.has(id),
  );
  const suggested = suggestMemberPlatformProfile({
    member,
    profiles: availableProfiles,
  });
  const option = suggested ? toLinkOption(suggested) : undefined;
  return { profile: option?.name ? option : undefined };
}

export function isEligibleForMemberPlatformLinking(member: User): boolean {
  return (
    !member.memberPlatformUserId &&
    !member.membershipId &&
    member.memberStatus === "onboarding" &&
    member.email
      ?.trim()
      .toLowerCase()
      .endsWith(`@${YFN_ORGANIZATION.domain}`) === true
  );
}

export async function findLinkableMemberPlatformProfile(
  profileId: string,
): Promise<MemberPlatformProfile> {
  const platformDb = await getMemberPlatformDb();
  if (!platformDb) {
    throw new Error("Die Member-Plattform ist nicht konfiguriert.");
  }

  const [profile, state] = await Promise.all([
    platformDb
      .collection<MemberPlatformProfile>("users")
      .findOne(
        { id: profileId, deletedAt: null },
        { projection: { _id: 0, id: 1, contact: 1 } },
      ),
    platformDb.collection("user-states").findOne({
      userId: profileId,
      current: { $in: [...LINKABLE_MEMBER_PLATFORM_STATES] },
    }),
  ]);
  if (!profile || !state) {
    throw new Error("Dieses Member-Profil ist nicht mehr verfügbar.");
  }
  return profile;
}

function toLinkOption(
  profile: MemberPlatformProfile,
): MemberPlatformLinkOption {
  return {
    id: profile.id,
    name: [profile.person?.firstName, profile.person?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim(),
    imageUrl: profile.images?.profileImage,
  };
}
