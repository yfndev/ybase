import { describe, expect, test } from "vitest";
import type { Department, Team } from "@/lib/db/types";
import { sortTeamsByDepartment } from "./sortTeamsByDepartment";

function department(_id: string): Department {
  return {
    _id,
    _creationTime: 0,
    name: _id,
    organizationId: "organization",
    isArchived: false,
    createdBy: "user",
  };
}

function team(_id: string, departmentId: string): Team {
  return {
    _id,
    _creationTime: 0,
    name: _id,
    departmentId,
    organizationId: "organization",
    isArchived: false,
    createdBy: "user",
  };
}

describe("sortTeamsByDepartment", () => {
  test("groups teams in department order while preserving their order within a department", () => {
    const teams = [
      team("Operations 1", "operations"),
      team("Education 1", "education"),
      team("Operations 2", "operations"),
    ];

    const sorted = sortTeamsByDepartment(teams, [
      department("operations"),
      department("education"),
    ]);

    expect(sorted.map(({ _id }) => _id)).toEqual([
      "Operations 1",
      "Operations 2",
      "Education 1",
    ]);
    expect(teams.map(({ _id }) => _id)).toEqual([
      "Operations 1",
      "Education 1",
      "Operations 2",
    ]);
  });

  test("places teams without a listed department last", () => {
    const sorted = sortTeamsByDepartment(
      [team("Unknown", "missing"), team("Operations", "operations")],
      [department("operations")],
    );

    expect(sorted.map(({ _id }) => _id)).toEqual(["Operations", "Unknown"]);
  });
});
