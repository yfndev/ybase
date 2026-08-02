import type { Db } from "mongodb";
import {
  type MemberPlatformProfile,
  normalizeEmail,
  normalizeName,
} from "../../memberPlatform/suggestions";
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

const NAME_NOT_FOUND_ERROR =
  "Kein aktives Member-Plattform-Profil mit dem Namen aus der Bewerbung gefunden.";
const EMAIL_NOT_FOUND_ERROR =
  "Kein aktives Member-Plattform-Profil für die private Bewerbungs-E-Mail gefunden.";
const AMBIGUOUS_ERROR =
  "Mehrere aktive Member-Plattform-Profile mit diesem Namen gefunden. Die private Bewerbungs-E-Mail konnte sie nicht eindeutig unterscheiden.";
const BIRTH_DATE_ERROR =
  "Das Member-Plattform-Profil enthält kein gültiges Geburtsdatum.";

interface ApplicationProfileLookup {
  applicantName?: string;
  privateEmail: string;
}

export async function findApplicationMemberPlatformProfile(
  lookup: ApplicationProfileLookup,
): Promise<ApplicationMemberPlatformSnapshot> {
  const database = await getMemberPlatformDb();
  if (!database) {
    throw new Error("Die Member-Plattform ist nicht konfiguriert.");
  }
  const resolution = await resolveProfile(database, lookup);
  if ("error" in resolution) throw new Error(resolution.error);
  return resolution.snapshot;
}

export async function tryFindApplicationMemberPlatformProfile(
  lookup: ApplicationProfileLookup,
): Promise<ApplicationMemberPlatformSnapshot | undefined> {
  try {
    const database = await getMemberPlatformDb();
    if (!database) return undefined;
    const resolution = await resolveProfile(database, lookup);
    return "snapshot" in resolution ? resolution.snapshot : undefined;
  } catch (error) {
    console.error("member-platform application snapshot failed", error);
    return undefined;
  }
}

async function resolveProfile(
  database: Db,
  lookup: ApplicationProfileLookup,
): Promise<Resolution> {
  const email = normalizeEmail(lookup.privateEmail);
  const nameQueries = buildNameQueries(lookup.applicantName);
  const candidateQueries = [
    ...nameQueries,
    ...(email ? [{ "contact.email": email }] : []),
  ];
  const notFoundError =
    nameQueries.length > 0 ? NAME_NOT_FOUND_ERROR : EMAIL_NOT_FOUND_ERROR;
  if (candidateQueries.length === 0) return { error: notFoundError };

  const profiles = await database
    .collection<MemberPlatformProfile>("users")
    .find({ deletedAt: null, $or: candidateQueries })
    .collation({ locale: "de", strength: 1 })
    .project<MemberPlatformProfile>({
      _id: 0,
      id: 1,
      person: 1,
      contact: 1,
    })
    .toArray();
  if (profiles.length === 0) return { error: notFoundError };

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
  const profile = selectProfile(eligibleProfiles, lookup);
  if (!profile) {
    return {
      error: eligibleProfiles.length > 1 ? AMBIGUOUS_ERROR : notFoundError,
    };
  }

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

function buildNameQueries(
  applicantName?: string,
): Array<Record<string, string>> {
  const parts = applicantName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const queries: Array<Record<string, string>> = [];
  for (let splitAt = 1; splitAt < parts.length; splitAt += 1) {
    queries.push({
      "person.firstName": parts.slice(0, splitAt).join(" "),
      "person.lastName": parts.slice(splitAt).join(" "),
    });
  }
  return queries;
}

function selectProfile(
  profiles: MemberPlatformProfile[],
  lookup: ApplicationProfileLookup,
): MemberPlatformProfile | undefined {
  const name = normalizeName(lookup.applicantName);
  const email = normalizeEmail(lookup.privateEmail);
  const nameMatches = name
    ? profiles.filter(
        (profile) =>
          normalizeName(
            [profile.person?.firstName, profile.person?.lastName]
              .filter(Boolean)
              .join(" "),
          ) === name,
      )
    : [];

  if (nameMatches.length === 1) return nameMatches[0];
  if (nameMatches.length > 1) {
    const emailMatches = nameMatches.filter(
      (profile) => normalizeEmail(profile.contact?.email) === email,
    );
    return emailMatches.length === 1 ? emailMatches[0] : undefined;
  }

  const emailMatches = profiles.filter(
    (profile) => normalizeEmail(profile.contact?.email) === email,
  );
  return emailMatches.length === 1 ? emailMatches[0] : undefined;
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
