import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("./manualWorkspaceProvisioning", () => ({
  provisionManualMemberWorkspace: vi.fn(),
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
import { createMember } from "./creation";
import { listMembers } from "./data";
import { setMemberStatus, setTeamOnboardingStatus } from "./lifecycleActions";
import { provisionManualMemberWorkspace } from "./manualWorkspaceProvisioning";
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
  vi.clearAllMocks();
  vi.mocked(provisionManualMemberWorkspace).mockResolvedValue({
    userId: "google-manual-member",
  });
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

test("createMember starts a member in onboarding and writes a log", async () => {
  await seedTeam("manual-team", orgA);
  const member = await createMember({
    name: "  Manual Member  ",
    email: "  MANUAL@YOUNGFOUNDERS.NETWORK  ",
    privateEmail: "  MANUAL@EXAMPLE.COM  ",
    phone: "  +49 170 1234567  ",
    teamId: "manual-team",
    isTeamLead: true,
  });

  const created = await (await users()).findOne({ _id: member._id });
  expect(created).toMatchObject({
    name: "Manual Member",
    email: "manual@youngfounders.network",
    privateEmail: "manual@example.com",
    phone: "+49 170 1234567",
    organizationId: orgA,
    role: "member",
    teamId: "manual-team",
    isTeamLead: true,
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
    publicProfileSetupRequired: true,
    googleWorkspaceUserId: "google-manual-member",
  });
  expect(typeof created?.registeredAt).toBe("number");
  expect(provisionManualMemberWorkspace).toHaveBeenCalledWith({
    name: "Manual Member",
    primaryEmail: "manual@youngfounders.network",
    privateEmail: "manual@example.com",
  });

  const log = await (await logs()).findOne({ action: "member.created" });
  expect(log).toMatchObject({
    userId: adminA,
    entityId: member._id,
    organizationId: orgA,
  });
});

test("createMember rejects invalid domains and duplicate profiles", async () => {
  await seedTeam("manual-team", orgA);
  await expect(
    createMember({
      name: "External Member",
      email: "member@example.org",
      privateEmail: "external@example.org",
      teamId: "manual-team",
      isTeamLead: false,
    }),
  ).rejects.toThrow("gültige YFN-E-Mail-Adresse");

  await createMember({
    name: "Existing Member",
    email: "existing@youngfounders.network",
    privateEmail: "existing@example.com",
    teamId: "manual-team",
    isTeamLead: false,
  });
  await expect(
    createMember({
      name: "Existing Member",
      email: "EXISTING@YOUNGFOUNDERS.NETWORK",
      privateEmail: "existing@example.com",
      teamId: "manual-team",
      isTeamLead: false,
    }),
  ).rejects.toThrow("bereits ein Profil");
});

test("createMember rejects leads for chapters", async () => {
  await seedTeam("manual-chapter", orgA, false, true);

  await expect(
    createMember({
      name: "Chapter Lead",
      email: "chapter@youngfounders.network",
      privateEmail: "chapter@example.com",
      teamId: "manual-chapter",
      isTeamLead: true,
    }),
  ).rejects.toThrow("Chapter haben keine Lead-Position");
});

test("createMember rolls back the profile when Workspace setup fails", async () => {
  await seedTeam("manual-team", orgA);
  vi.mocked(provisionManualMemberWorkspace).mockRejectedValueOnce(
    new Error("Zugangsdaten konnten nicht versendet werden"),
  );

  await expect(
    createMember({
      name: "Failed Member",
      email: "failed@youngfounders.network",
      privateEmail: "failed@example.com",
      teamId: "manual-team",
      isTeamLead: false,
    }),
  ).rejects.toThrow("Zugangsdaten konnten nicht versendet werden");

  expect(
    await (await users()).findOne({ email: "failed@youngfounders.network" }),
  ).toBeNull();
  expect(await (await logs()).findOne({ action: "member.created" })).toBeNull();
});

test("rejects invalid private contact details", async () => {
  await seedTeam("manual-team", orgA);

  await expect(
    createMember({
      name: "Invalid Contact",
      email: "invalid@youngfounders.network",
      privateEmail: "not-an-email",
      teamId: "manual-team",
      isTeamLead: false,
    }),
  ).rejects.toThrow("gültige private E-Mail-Adresse");

  await expect(
    updateMemberProfile({ userId: memberA, phone: "call me" }),
  ).rejects.toThrow("gültige Telefonnummer");
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

test("updateMemberProfile updates and clears private contact details", async () => {
  await updateMemberProfile({
    userId: memberA,
    privateEmail: "  MEMBER.PRIVATE@EXAMPLE.COM  ",
    phone: "  +49 170 7654321  ",
  });
  expect(await (await users()).findOne({ _id: memberA })).toMatchObject({
    privateEmail: "member.private@example.com",
    phone: "+49 170 7654321",
  });

  await updateMemberProfile({
    userId: memberA,
    privateEmail: null,
    phone: null,
  });
  const cleared = await (await users()).findOne({ _id: memberA });
  expect(cleared).not.toHaveProperty("privateEmail");
  expect(cleared).not.toHaveProperty("phone");
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

test("setMemberStatus cannot skip the getting-to-know phase", async () => {
  await (
    await users()
  ).updateOne({ _id: memberA }, { $set: { memberStatus: "getting_to_know" } });

  await expect(
    setMemberStatus({ userId: memberA, status: "active" }),
  ).rejects.toThrow("Kennenlernphase");
});

test("setMemberStatus requires a team assignment before activation", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });

  await expect(
    setMemberStatus({ userId: memberA, status: "active" }),
  ).rejects.toThrow("ein aktives Team");
});

test("setMemberStatus activates a board member with an additional team", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  const departmentId = await seedDepartment(orgA);
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    boardMembership: { departmentId, isChair: true },
    secondaryTeamId: "team-1",
    isSecondaryTeamLead: true,
  });

  await setMemberStatus({ userId: memberA, status: "active" });

  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("active");
  expect(updated?.teamId).toBeUndefined();
  expect(updated?.secondaryTeamId).toBe("team-1");
  expect(updated?.isSecondaryTeamLead).toBe(true);
});

test("completed onboarding stays locked after member approval", async () => {
  await setTeamOnboardingStatus({ userId: memberA, status: "completed" });
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
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

test("setMemberStatus rejects legacy offboarded writes", async () => {
  await expect(
    setMemberStatus({
      userId: memberA,
      status: "offboarded" as never,
    }),
  ).rejects.toThrow();
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("onboarding");
  expect(updated?.archivedAt).toBeUndefined();
});

test("setMemberStatus records manual exclusions separately", async () => {
  await setMemberStatus({ userId: memberA, status: "excluded" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.memberStatus).toBe("excluded");
  expect(typeof updated?.excludedAt).toBe("number");
  expect(updated?.archivedAt).toBeUndefined();
});

test("setMemberStatus cannot bypass a managed membership workflow", async () => {
  await (
    await users()
  ).updateOne({ _id: memberA }, { $set: { membershipId: newId() } });

  await expect(
    setMemberStatus({ userId: memberA, status: "excluded" }),
  ).rejects.toThrow("durch den Mitgliedschaftsvorgang gesteuert");

  const unchanged = await (await users()).findOne({ _id: memberA });
  expect(unchanged?.memberStatus).toBe("onboarding");
  expect(unchanged?.excludedAt).toBeUndefined();
});

test("setMemberStatus cannot touch a user from another org", async () => {
  await expect(
    setMemberStatus({ userId: memberB, status: "archived" }),
  ).rejects.toThrow("User not found");
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

test("updateMemberProfile assigns a team and its lead role", async () => {
  await seedTeam("team-1", orgA);
  await updateMemberProfile({
    userId: memberA,
    teamId: "team-1",
    isTeamLead: true,
  });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.teamId).toBe("team-1");
  expect(updated?.isTeamLead).toBe(true);
});

test("updateMemberProfile protects legal contact data without blocking team changes", async () => {
  await seedTeam("team-1", orgA);
  await (
    await users()
  ).updateOne({ _id: memberA }, { $set: { membershipId: newId() } });

  await expect(
    updateMemberProfile({
      userId: memberA,
      privateEmail: "new@example.org",
    }),
  ).rejects.toThrow("Mitgliedschaftsakte");

  await updateMemberProfile({ userId: memberA, teamId: "team-1" });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.privateEmail).toBeUndefined();
  expect(updated?.teamId).toBe("team-1");
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

test("updateMemberProfile rejects leads for chapters", async () => {
  await seedTeam("team-chapter", orgA, false, true);

  await expect(
    updateMemberProfile({
      userId: memberA,
      teamId: "team-chapter",
      isTeamLead: true,
    }),
  ).rejects.toThrow("keine Lead-Position");
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
    boardMembership: {
      departmentId,
      isChair: true,
    },
  });
  const assigned = await (await users()).findOne({ _id: memberA });
  expect(assigned?.boardMembership).toEqual({
    departmentId,
    isChair: true,
  });
  expect(assigned?.teamId).toBeUndefined();
  expect(assigned?.secondaryTeamId).toBe("team-chapter");
  expect(assigned?.isTeamLead).toBe(false);
  expect(assigned?.isSecondaryTeamLead).toBe(true);

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

test("updateMemberProfile gives board members only an additional team", async () => {
  const departmentId = await seedDepartment(orgA);
  await updateMemberProfile({
    userId: memberA,
    boardMembership: { departmentId, isChair: false },
  });
  await seedTeam("team-1", orgA);

  await expect(
    updateMemberProfile({ userId: memberA, teamId: "team-1" }),
  ).rejects.toThrow("kein Hauptteam");
  await expect(
    updateMemberProfile({
      userId: memberA,
      isSecondaryTeamLead: true,
    }),
  ).rejects.toThrow("zugeordnetes weiteres Team");

  await updateMemberProfile({
    userId: memberA,
    secondaryTeamId: "team-1",
    isSecondaryTeamLead: true,
  });
  const updated = await (await users()).findOne({ _id: memberA });
  expect(updated?.secondaryTeamId).toBe("team-1");
  expect(updated?.isSecondaryTeamLead).toBe(true);
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

test("listMembers keeps archived profiles visible", async () => {
  await setMemberStatus({ userId: memberA, status: "archived" });
  const members = await listMembers();
  const archived = members.find((member) => member._id === memberA);
  expect(archived?.memberStatus).toBe("archived");
});
