"use server";

import {
  searchApplicationMemberPlatformProfiles,
  selectApplicationMemberPlatformProfile,
} from "./admissionRequirements";
import type { ApplicationMemberPlatformCandidate } from "./memberPlatformCandidates";

export type ApplicationProfileSearchResult =
  | { ok: true; candidates: ApplicationMemberPlatformCandidate[] }
  | { ok: false };

export type ApplicationProfileSelectionResult = { ok: true } | { ok: false };

export async function searchApplicationMemberPlatformProfilesAction(
  input: Parameters<typeof searchApplicationMemberPlatformProfiles>[0],
): Promise<ApplicationProfileSearchResult> {
  try {
    const candidates = await searchApplicationMemberPlatformProfiles(input);
    return { ok: true, candidates };
  } catch (error) {
    console.error("application member profile search failed", error);
    return { ok: false };
  }
}

export async function selectApplicationMemberPlatformProfileAction(
  input: Parameters<typeof selectApplicationMemberPlatformProfile>[0],
): Promise<ApplicationProfileSelectionResult> {
  try {
    await selectApplicationMemberPlatformProfile(input);
    return { ok: true };
  } catch (error) {
    console.error("application member profile selection failed", error);
    return { ok: false };
  }
}
