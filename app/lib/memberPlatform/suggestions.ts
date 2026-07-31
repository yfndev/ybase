const COLLATOR = new Intl.Collator("de", { sensitivity: "base" });

export interface MemberPlatformProfile {
  id: string;
  deletedAt?: Date | null;
  person?: { firstName?: string; lastName?: string };
  contact?: { email?: string; phone?: string };
  auth?: { provider?: string; providerId?: string };
  images?: { profileImage?: string };
}

interface SuggestionSource {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  privateEmail?: string;
  phone?: string;
  googleWorkspaceUserId?: string;
}

interface RankedProfile {
  profile: MemberPlatformProfile;
  score: number;
}

export function suggestMemberPlatformProfile({
  member,
  profiles,
}: {
  member: SuggestionSource;
  profiles: MemberPlatformProfile[];
}): MemberPlatformProfile | undefined {
  const ranked = profiles
    .map((profile) => ({
      profile,
      score: profileScore(member, profile),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareRankedProfiles);
  const [best, second] = ranked;
  if (!best || second?.score === best.score) return undefined;
  return best.profile;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

export function normalizeName(value: unknown): string {
  return typeof value === "string"
    ? value
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
    : "";
}

function compareRankedProfiles(
  left: RankedProfile,
  right: RankedProfile,
): number {
  return (
    right.score - left.score ||
    COLLATOR.compare(left.profile.id, right.profile.id)
  );
}

function profileScore(
  member: SuggestionSource,
  profile: MemberPlatformProfile,
): number {
  let score = 0;
  if (
    member.googleWorkspaceUserId &&
    profile.auth?.provider === "google" &&
    member.googleWorkspaceUserId === profile.auth.providerId
  ) {
    score += 400;
  }

  const platformEmail = normalizeEmail(profile.contact?.email);
  if (platformEmail && platformEmail === normalizeEmail(member.privateEmail)) {
    score += 300;
  }
  if (platformEmail && platformEmail === normalizeEmail(member.email)) {
    score += 250;
  }

  const platformPhone = normalizePhone(profile.contact?.phone);
  if (platformPhone && platformPhone === normalizePhone(member.phone)) {
    score += 200;
  }

  const memberName = normalizeName(
    member.name ||
      [member.firstName, member.lastName].filter(Boolean).join(" "),
  );
  const profileName = normalizeName(
    [profile.person?.firstName, profile.person?.lastName]
      .filter(Boolean)
      .join(" "),
  );
  if (memberName && memberName === profileName) score += 100;
  return score;
}
