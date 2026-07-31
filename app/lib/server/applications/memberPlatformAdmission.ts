import type { Db } from "mongodb";
import type { MemberPlatformProfile } from "../../memberPlatform/suggestions";
import { normalizeEmail } from "../../memberPlatform/suggestions";
import { LINKABLE_MEMBER_PLATFORM_STATES } from "../../memberPlatform/states";
import { ageOnDate } from "../../members/legalDates";
import { getMemberPlatformDb } from "../memberPlatform/client";

export interface ApplicationMemberPlatformSnapshot {
  memberPlatformUserId: string;
  memberPlatformSyncedAt: number;
  dateOfBirth: string;
}

type Resolution =
  | { snapshot: ApplicationMemberPlatformSnapshot }
  | { error: string };

const NOT_FOUND_ERROR =
  "Kein eindeutiges, aktives Member-Plattform-Profil für die private Bewerbungs-E-Mail gefunden.";
const BIRTH_DATE_ERROR =
  "Das Member-Plattform-Profil enthält kein gültiges Geburtsdatum.";

export async function findApplicationMemberPlatformProfile(
  privateEmail: string,
): Promise<ApplicationMemberPlatformSnapshot> {
  const database = await getMemberPlatformDb();
  if (!database) {
    throw new Error("Die Member-Plattform ist nicht konfiguriert.");
  }
  const resolution = await resolveProfile(database, privateEmail);
  if ("error" in resolution) throw new Error(resolution.error);
  return resolution.snapshot;
}

export async function tryFindApplicationMemberPlatformProfile(
  privateEmail: string,
): Promise<ApplicationMemberPlatformSnapshot | undefined> {
  try {
    const database = await getMemberPlatformDb();
    if (!database) return undefined;
    const resolution = await resolveProfile(database, privateEmail);
    return "snapshot" in resolution ? resolution.snapshot : undefined;
  } catch (error) {
    console.error("member-platform application snapshot failed", error);
    return undefined;
  }
}

async function resolveProfile(
  database: Db,
  privateEmail: string,
): Promise<Resolution> {
  const email = normalizeEmail(privateEmail);
  const profiles = await database
    .collection<MemberPlatformProfile>("users")
    .find({ deletedAt: null, "contact.email": email })
    .collation({ locale: "en", strength: 2 })
    .project<MemberPlatformProfile>({
      _id: 0,
      id: 1,
      person: 1,
    })
    .toArray();
  if (profiles.length === 0) return { error: NOT_FOUND_ERROR };

  const states = await database
    .collection("user-states")
    .find({
      userId: { $in: profiles.map(({ id }) => id) },
      current: { $in: [...LINKABLE_MEMBER_PLATFORM_STATES] },
    })
    .project<{ userId: string }>({ _id: 0, userId: 1 })
    .toArray();
  const eligibleIds = new Set(states.map(({ userId }) => userId));
  const eligibleProfiles = profiles.filter(({ id }) => eligibleIds.has(id));
  if (eligibleProfiles.length !== 1) return { error: NOT_FOUND_ERROR };

  const profile = eligibleProfiles[0];
  const dateOfBirth = normalizeBirthDate(profile.person?.birthDate);
  if (!dateOfBirth) return { error: BIRTH_DATE_ERROR };
  return {
    snapshot: {
      memberPlatformUserId: profile.id,
      memberPlatformSyncedAt: Date.now(),
      dateOfBirth,
    },
  };
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
