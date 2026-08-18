import {
  type MemberPlatformProfile,
  normalizeEmail,
} from "../../memberPlatform/suggestions";
import { LINKABLE_MEMBER_PLATFORM_STATES } from "../../memberPlatform/states";
import { ageOnDate } from "../../members/legalDates";
import { getMemberPlatformDb } from "../memberPlatform/client";
import { searchMemberPlatformProfilesWithAtlas } from "./memberPlatformAtlasSearch";
import type { ApplicationMemberPlatformSnapshot } from "./memberPlatformAdmission";

const CANDIDATE_LIMIT = 5;

export interface ApplicationMemberPlatformCandidate {
  id: string;
  name: string;
  email?: string;
  dateOfBirth: string;
}

interface ApplicationProfileLookup {
  applicantName?: string;
  privateEmail: string;
}

export async function searchApplicationMemberPlatformCandidates(
  lookup: ApplicationProfileLookup,
): Promise<ApplicationMemberPlatformCandidate[]> {
  const database = await requireMemberPlatformDb();
  const profiles = await searchMemberPlatformProfilesWithAtlas(
    database,
    lookup,
  );
  return profiles
    .flatMap((profile) => {
      const candidate = toCandidate(profile);
      return candidate ? [candidate] : [];
    })
    .slice(0, CANDIDATE_LIMIT);
}

export async function loadApplicationMemberPlatformSnapshot(
  profileId: string,
): Promise<ApplicationMemberPlatformSnapshot> {
  const database = await requireMemberPlatformDb();
  const [profile, state] = await Promise.all([
    database
      .collection<MemberPlatformProfile>("users")
      .findOne(
        { id: profileId, deletedAt: null },
        { projection: { _id: 0, id: 1, person: 1 } },
      ),
    database.collection("user-states").findOne({
      userId: profileId,
      current: { $in: [...LINKABLE_MEMBER_PLATFORM_STATES] },
    }),
  ]);
  const dateOfBirth = normalizeBirthDate(profile?.person?.birthDate);
  if (!profile || !state || !dateOfBirth) {
    throw new Error("Member-Profil ist nicht für die Aufnahme verfügbar.");
  }
  return {
    memberPlatformUserId: profile.id,
    memberPlatformSyncedAt: Date.now(),
    dateOfBirth,
  };
}

async function requireMemberPlatformDb() {
  const database = await getMemberPlatformDb();
  if (!database) throw new Error("Member-Plattform ist nicht konfiguriert.");
  return database;
}

function toCandidate(
  profile: MemberPlatformProfile,
): ApplicationMemberPlatformCandidate | null {
  const name = [profile.person?.firstName, profile.person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const dateOfBirth = normalizeBirthDate(profile.person?.birthDate);
  if (!profile.id || !name || !dateOfBirth) return null;
  const email = normalizeEmail(profile.contact?.email);
  return { id: profile.id, name, dateOfBirth, ...(email ? { email } : {}) };
}

function normalizeBirthDate(value: string | Date | undefined): string | null {
  const raw = value instanceof Date ? value.toISOString() : value?.trim();
  const date = raw?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!date) return null;
  try {
    ageOnDate(date, Date.now());
    return date;
  } catch {
    return null;
  }
}
