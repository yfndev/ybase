import { expect, test } from "vitest";
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const NOW = 1_700_000_000_000;

test("activating a member records the onboarding timestamp", () => {
  expect(memberStatusPatch("onboarding", "active", NOW)).toEqual({
    memberStatus: "active",
    onboardedAt: NOW,
  });
});

test("offboarding a member records the offboarding timestamp", () => {
  expect(memberStatusPatch("active", "offboarded", NOW)).toEqual({
    memberStatus: "offboarded",
    offboardedAt: NOW,
  });
});

test("member status without a target timestamp only updates the status", () => {
  expect(memberStatusPatch("active", "onboarding", NOW)).toEqual({
    memberStatus: "onboarding",
  });
});

test("re-applying the same member status does not stamp a timestamp", () => {
  expect(memberStatusPatch("active", "active", NOW)).toEqual({
    memberStatus: "active",
  });
});

test("completing team onboarding records the team onboarding timestamp", () => {
  expect(teamOnboardingPatch("in_progress", "completed", NOW)).toEqual({
    teamOnboardingStatus: "completed",
    teamOnboardedAt: NOW,
  });
});

test("intermediate team onboarding states carry no timestamp", () => {
  expect(teamOnboardingPatch("not_started", "in_progress", NOW)).toEqual({
    teamOnboardingStatus: "in_progress",
  });
});

test("re-applying completed team onboarding does not stamp again", () => {
  expect(teamOnboardingPatch("completed", "completed", NOW)).toEqual({
    teamOnboardingStatus: "completed",
  });
});
