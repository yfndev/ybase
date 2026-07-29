import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  requirePermission: vi.fn(),
}));

import {
  requirePermission,
  requireRole,
  requireUser,
} from "../../auth/session";
import {
  departments,
  logs,
  organizations,
  teams,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { listMembers } from "./data";
import { setMemberStatus, setTeamOnboardingStatus } from "./lifecycleActions";
import { addUserToOrganization } from "./membership";
import { updateBankDetails, updateMemberProfile } from "./profile";
import { updateUserRole } from "./roles";

let orgA: string;
let orgB: string;
let adminA: string;
let memberA: string;
let memberB: string;

setupTestDatabase();

beforeEach(async () => {
  orgA = newId();
  orgB = newId();
  adminA = newId();
  memberA = newId();
  memberB = newId();
  await (
    await organizations()
  ).insertMany([
    {
      _id: orgA,
      _creationTime: Date.now(),
      name: "A",
      domain: "a.org",
      createdBy: adminA,
    },
    {
      _id: orgB,
      _creationTime: Date.now(),
      name: "B",
      domain: "b.org",
      createdBy: memberB,
    },
  ]);
  await (
    await users()
  ).insertMany([
    {
      _id: adminA,
      _creationTime: Date.now(),
      name: "Admin A",
      email: "admin@a.org",
      organizationId: orgA,
      role: "admin",
      memberStatus: "active",
      teamOnboardingStatus: "completed",
    },
    {
      _id: memberA,
      _creationTime: Date.now(),
      name: "Member A",
      email: "member@a.org",
      organizationId: orgA,
      role: "member",
      memberStatus: "onboarding",
      teamOnboardingStatus: "not_started",
    },
    {
      _id: memberB,
      _creationTime: Date.now(),
      name: "Member B",
      email: "member@b.org",
      organizationId: orgB,
      role: "member",
      memberStatus: "active",
      teamOnboardingStatus: "completed",
    },
  ]);
  const actor = createTestActor({
    _id: adminA,
    organizationId: orgA,
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requireRole).mockResolvedValue(actor);
  vi.mocked(requirePermission).mockResolvedValue(actor);
});

test("updateUserRole promotes a member to admin and writes a log", async () => {
  await updateUserRole({ userId: memberA, role: "admin" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("admin");
  const log = await (await logs()).findOne({ action: "user.role_change" });
  expect(log?.entityId).toBe(memberA);
});

test("updateUserRole grants finance access without admin access", async () => {
  await updateUserRole({ userId: memberA, role: "finance" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("finance");
});

test("updateUserRole supports the People & Culture role", async () => {
  await updateUserRole({ userId: memberA, role: "people_culture" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.role).toBe("people_culture");
});

test("updateUserRole cannot touch a user from another org", async () => {
  await expect(
    updateUserRole({ userId: memberB, role: "admin" }),
  ).rejects.toThrow("Access denied");
});

test("updateUserRole blocks demoting the last admin", async () => {
  await expect(
    updateUserRole({ userId: adminA, role: "member" }),
  ).rejects.toThrow(
    "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
  );
});

test("addUserToOrganization cannot pull in a user from another org", async () => {
  await expect(
    addUserToOrganization({ userId: memberB, organizationId: orgA }),
  ).rejects.toThrow("User not found");
  const unchanged = await (await users()).findOne({ _id: memberB });
  expect(unchanged?.organizationId).toBe(orgB);
});

test("updateBankDetails updates the caller's own bank details", async () => {
  await updateBankDetails({
    iban: "de89 3704 0044 0532 0130 00",
    bic: "cobadeffxxx",
    accountHolder: "Admin A",
  });
  const updated = await (await users()).findOne({ _id: adminA });
  expect(updated?.iban).toBe("DE89370400440532013000");
  expect(updated?.bic).toBe("COBADEFFXXX");
  expect(updated?.accountHolder).toBe("Admin A");
});

test("updateBankDetails rejects missing bank details", async () => {
  await expect(
    updateBankDetails({ iban: "", bic: "", accountHolder: "" }),
  ).rejects.toThrow();
});

test("setMemberStatus requires completed onboarding before approval", async () => {
  await expect(
    setMemberStatus({ userId: memberA, status: "active" }),
  ).rejects.toThrow("Abschluss aller Onboarding-Aufgaben");
});

test("setMemberStatus approves a fully onboarded member", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
  });
  await setMemberStatus({ userId: memberA, status: "active" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("active");
  expect(typeof updated?.onboardedAt).toBe("number");
  const log = await (await logs()).findOne({ action: "member.status_change" });
  expect(log?.entityId).toBe(memberA);
});

test("setMemberStatus requires a team assignment before activation", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });

  await expect(
    setMemberStatus({ userId: memberA, status: "active" }),
  ).rejects.toThrow("ein aktives Team");
});

test("setMemberStatus activates a board member without a team", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  const departmentId = await seedDepartment(orgA);
  await updateMemberProfile({
    userId: memberA,
    boardMembership: { departmentId, isChair: true },
  });

  await setMemberStatus({ userId: memberA, status: "active" });

  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("active");
  expect(updated?.teamId).toBeUndefined();
});

test("completed onboarding stays locked after member approval", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    positionTitle: "Teammitglied",
  });
  await setMemberStatus({ userId: memberA, status: "active" });

  await expect(
    setTeamOnboardingStatus({ userId: memberA, status: "in_progress" }),
  ).rejects.toThrow("kann nicht erneut geöffnet werden");

  await setMemberStatus({ userId: memberA, status: "offboarding_planned" });
  await expect(
    setTeamOnboardingStatus({ userId: memberA, status: "in_progress" }),
  ).rejects.toThrow("kann nicht erneut geöffnet werden");
});

test("setMemberStatus records every offboarding phase", async () => {
  await setMemberStatus({ userId: memberA, status: "offboarding_planned" });
  let updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("offboarding_planned");
  expect(typeof updated?.offboardingPlannedAt).toBe("number");

  await setMemberStatus({ userId: memberA, status: "offboarding" });
  updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("offboarding");
  expect(typeof updated?.offboardingStartedAt).toBe("number");

  await setMemberStatus({ userId: memberA, status: "archived" });
  updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("archived");
  expect(typeof updated?.archivedAt).toBe("number");
});

test("setMemberStatus maps legacy offboarded writes to archived", async () => {
  await setMemberStatus({ userId: memberA, status: "offboarded" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("archived");
  expect(typeof updated?.archivedAt).toBe("number");
});

test("setMemberStatus cannot touch a user from another org", async () => {
  await expect(
    setMemberStatus({ userId: memberB, status: "archived" }),
  ).rejects.toThrow("User not found");
});

test("setTeamOnboardingStatus completes team onboarding with a timestamp", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamOnboardingStatus).toBe("completed");
  expect(typeof updated?.teamOnboardedAt).toBe("number");
});

async function seedTeam(
  id: string,
  organizationId: string,
  isArchived = false,
  isChapter = false,
) {
  await (
    await teams()
  ).insertOne({
    _id: id,
    _creationTime: Date.now(),
    name: id,
    departmentId: "dept-1",
    organizationId,
    isChapter,
    isArchived,
    createdBy: adminA,
  });
}

async function seedDepartment(
  organizationId: string,
  isArchived = false,
): Promise<string> {
  const departmentId = newId();
  await (
    await departments()
  ).insertOne({
    _id: departmentId,
    _creationTime: Date.now(),
    name: "Operations",
    organizationId,
    isArchived,
    createdBy: adminA,
  });
  return departmentId;
}

test("updateMemberProfile assigns a team and can clear an optional position", async () => {
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    positionTitle: "Treasurer",
    isTeamLead: true,
  });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamId).toBe("team-1");
  expect(updated?.positionTitle).toBe("Treasurer");
  expect(updated?.isTeamLead).toBe(true);

  await updateMemberProfile({
    userId: memberA,
    positionTitle: null,
  });
  const cleared = await (await users()).findOne({ _id: memberA });
  expect(cleared?.positionTitle).toBeUndefined();
});

test("updateMemberProfile assigns a different optional second team", async () => {
  await seedTeam("team-1", orgA);
  await seedTeam("team-chapter", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    secondaryTeamId: "team-chapter",
    isTeamLead: true,
    isSecondaryTeamLead: true,
  });

  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamId).toBe("team-1");
  expect(updated?.secondaryTeamId).toBe("team-chapter");
  expect(updated?.isTeamLead).toBe(true);
  expect(updated?.isSecondaryTeamLead).toBe(true);

  await expect(
    updateMemberProfile({
      userId: memberA,
      secondaryTeamId: "team-1",
    }),
  ).rejects.toThrow("müssen unterschiedlich sein");

  await updateMemberProfile({
    userId: memberA,
    secondaryTeamId: null,
  });
  const cleared = await (await users()).findOne({ _id: memberA });
  expect(cleared?.secondaryTeamId).toBeUndefined();
  expect(cleared?.isSecondaryTeamLead).toBe(false);
});

test("updateMemberProfile rejects positions reserved from chapters", async () => {
  await seedTeam("team-chapter", orgA, false, true);

  await expect(
    updateMemberProfile({
      userId: memberA,
      teamId: "team-chapter",
      isTeamLead: true,
    }),
  ).rejects.toThrow("keine Lead-Position");
  await expect(
    updateMemberProfile({
      userId: memberA,
      teamId: "team-chapter",
      positionTitle: "Regional Lead",
    }),
  ).rejects.toThrow("keine allgemeine Position");
});

test("updateMemberProfile assigns and removes a board membership", async () => {
  await seedTeam("team-1", orgA);
  await seedTeam("team-chapter", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    secondaryTeamId: "team-chapter",
    isTeamLead: true,
    isSecondaryTeamLead: true,
  });
  const departmentId = await seedDepartment(orgA);
  await updateMemberProfile({
    userId: memberA,
    boardMembership: { departmentId, isChair: true },
  });
  const assigned = await (await users()).findOne({ _id: memberA });
  expect(assigned?.boardMembership).toEqual({
    departmentId,
    isChair: true,
  });
  expect(assigned?.teamId).toBeUndefined();
  expect(assigned?.secondaryTeamId).toBeUndefined();
  expect(assigned?.isTeamLead).toBe(false);
  expect(assigned?.isSecondaryTeamLead).toBe(false);

  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    secondaryTeamId: "team-chapter",
    isTeamLead: true,
    isSecondaryTeamLead: true,
    boardMembership: null,
  });
  const removed = await (await users()).findOne({ _id: memberA });
  expect(removed).not.toHaveProperty("boardMembership");
  expect(removed?.teamId).toBe("team-1");
  expect(removed?.secondaryTeamId).toBe("team-chapter");
  expect(removed?.isTeamLead).toBe(true);
  expect(removed?.isSecondaryTeamLead).toBe(true);
});

test("updateMemberProfile rejects an unavailable board department", async () => {
  const foreignDepartmentId = await seedDepartment(orgB);
  await expect(
    updateMemberProfile({
      userId: memberA,
      boardMembership: {
        departmentId: foreignDepartmentId,
        isChair: false,
      },
    }),
  ).rejects.toThrow("Department nicht verfügbar");
});

test("updateMemberProfile prevents a board member from joining a team", async () => {
  const departmentId = await seedDepartment(orgA);
  await updateMemberProfile({
    userId: memberA,
    boardMembership: { departmentId, isChair: false },
  });
  await seedTeam("team-1", orgA);

  await expect(
    updateMemberProfile({ userId: memberA, teamId: "team-1" }),
  ).rejects.toThrow("einem Department statt einem Team");
  await expect(
    updateMemberProfile({
      userId: memberA,
      secondaryTeamId: "team-1",
    }),
  ).rejects.toThrow("einem Department statt einem Team");
  await expect(
    updateMemberProfile({
      userId: memberA,
      isSecondaryTeamLead: true,
    }),
  ).rejects.toThrow("einem Department statt einem Team");
});

test("updateMemberProfile rejects a team from another org", async () => {
  await seedTeam("team-b", orgB);
  await expect(
    updateMemberProfile({ userId: memberA, teamId: "team-b" }),
  ).rejects.toThrow("Team nicht verfügbar");
  await expect(
    updateMemberProfile({
      userId: memberA,
      secondaryTeamId: "team-b",
    }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("updateMemberProfile rejects an archived team", async () => {
  await seedTeam("team-archived", orgA, true);
  await expect(
    updateMemberProfile({ userId: memberA, teamId: "team-archived" }),
  ).rejects.toThrow("Team nicht verfügbar");
  await expect(
    updateMemberProfile({
      userId: memberA,
      secondaryTeamId: "team-archived",
    }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("listMembers keeps archived profiles visible", async () => {
  await setMemberStatus({ userId: memberA, status: "archived" });
  const members = await listMembers();
  const archived = members.find((member) => member._id === memberA);
  expect(archived?.memberStatus).toBe("archived");
});
