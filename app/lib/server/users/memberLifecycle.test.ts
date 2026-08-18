import { expect, test } from "vitest";
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const NOW = 1_700_000_000_000;

test("activating a member records the onboarding timestamp", () => {
  expect(memberStatusPatch("onboarding", "active", NOW)).toEqual({
    memberStatus: "active",
    onboardedAt: NOW,
  });
});

test("planning an offboarding records the internal timestamp", () => {
  expect(memberStatusPatch("active", "offboarding_planned", NOW)).toEqual({
    memberStatus: "offboarding_planned",
    offboardingPlannedAt: NOW,
  });
});

test("starting an offboarding records the official timestamp", () => {
  expect(memberStatusPatch("offboarding_planned", "offboarding", NOW)).toEqual({
    memberStatus: "offboarding",
    offboardingStartedAt: NOW,
  });
});

test("archiving a member records the completion timestamp", () => {
  expect(memberStatusPatch("offboarding", "archived", NOW)).toEqual({
    memberStatus: "archived",
    archivedAt: NOW,
  });
});

test("excluding a member records a separate exclusion timestamp", () => {
  expect(memberStatusPatch("active", "excluded", NOW)).toEqual({
    memberStatus: "excluded",
    excludedAt: NOW,
  });
});

test("returning to onboarding only updates the status", () => {
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
