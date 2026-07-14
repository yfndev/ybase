import { expect, test } from "vitest";
import type { Team, User } from "@/lib/db/types";
import { ALL, filterMembers, memberStatusOf } from "./filterMembers";

function member(overrides: Partial<User>): User {
  return { _id: "id", _creationTime: 0, ...overrides };
}

function team(id: string, departmentId: string): Team {
  return {
    _id: id,
    _creationTime: 0,
    name: id,
    departmentId,
    organizationId: "org",
    isArchived: false,
    createdBy: "admin",
  };
}

const teamsById = new Map<string, Team>([
  ["team-eng", team("team-eng", "dept-tech")],
  ["team-ops", team("team-ops", "dept-ops")],
]);

const anna = member({
  _id: "anna",
  name: "Anna Admin",
  email: "anna@youngfounders.network",
  memberStatus: "active",
  teamId: "team-eng",
  positionTitle: "Treasurer",
});
const ben = member({
  _id: "ben",
  name: "Ben Beta",
  email: "ben@youngfounders.network",
  memberStatus: "onboarding",
  teamId: "team-ops",
});
const cara = member({
  _id: "cara",
  name: "Cara Care",
  memberStatus: "offboarded",
});
const legacy = member({ _id: "legacy", name: "No Status" });

const everyone = [anna, ben, cara, legacy];

const baseFilters = {
  status: "active" as const,
  departmentId: ALL,
  teamId: ALL,
  search: "",
};

test("memberStatusOf defaults a missing status to onboarding", () => {
  expect(memberStatusOf(legacy)).toBe("onboarding");
});

test("filters by membership status tab", () => {
  const active = filterMembers(everyone, baseFilters, teamsById);
  expect(active.map((entry) => entry._id)).toEqual(["anna"]);

  const onboarding = filterMembers(
    everyone,
    { ...baseFilters, status: "onboarding" },
    teamsById,
  );
  expect(onboarding.map((entry) => entry._id).sort()).toEqual([
    "ben",
    "legacy",
  ]);
});

test("filters by department derived from the member's team", () => {
  const result = filterMembers(
    everyone,
    { ...baseFilters, status: "onboarding", departmentId: "dept-ops" },
    teamsById,
  );
  expect(result.map((entry) => entry._id)).toEqual(["ben"]);
});

test("filters by team", () => {
  const result = filterMembers(
    everyone,
    { ...baseFilters, teamId: "team-eng" },
    teamsById,
  );
  expect(result.map((entry) => entry._id)).toEqual(["anna"]);
});

test("search matches name, email and position case-insensitively", () => {
  expect(
    filterMembers(everyone, { ...baseFilters, search: "treasurer" }, teamsById),
  ).toHaveLength(1);
  expect(
    filterMembers(everyone, { ...baseFilters, search: "ANNA@" }, teamsById),
  ).toHaveLength(1);
  expect(
    filterMembers(everyone, { ...baseFilters, search: "missing" }, teamsById),
  ).toHaveLength(0);
});
