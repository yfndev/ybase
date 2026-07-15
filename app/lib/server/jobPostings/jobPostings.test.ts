import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission, requireUser } from "../../auth/session";
import { departments, jobPostings, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { createJobPostingDraft, updateJobPosting } from "./actions";
import { getJobPostingById, getJobPostings } from "./data";

let orgA: string;
let orgB: string;
let userA: string;
let teamA: string;

async function insertTeam(
  organizationId: string,
  isArchived = false,
): Promise<string> {
  const departmentId = newId();
  await (
    await departments()
  ).insertOne({
    _id: departmentId,
    _creationTime: Date.now(),
    name: "Dept",
    organizationId,
    isArchived: false,
    createdBy: userA,
  });
  const _id = newId();
  await (
    await teams()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    name: "Team",
    departmentId,
    organizationId,
    isArchived,
    createdBy: userA,
  });
  return _id;
}

async function insertMember(
  organizationId: string,
  overrides: Partial<User> = {},
): Promise<string> {
  const _id = overrides._id ?? newId();
  await (
    await users()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId,
    email: `${_id}@example.org`,
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    ...overrides,
  });
  return _id;
}

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
    role: "people_culture",
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requirePermission).mockResolvedValue(actor);
  teamA = await insertTeam(orgA);
});

test("createJobPostingDraft stores a draft scoped to the org without a department", async () => {
  const id = await createJobPostingDraft({ title: "Vorstand", teamId: teamA });
  const foreignTeam = await insertTeam(orgB);
  await (
    await jobPostings()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: orgB,
    teamId: foreignTeam,
    status: "draft",
    title: "Fremd",
    createdBy: newId(),
  });

  const list = await getJobPostings();
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ _id: id, title: "Vorstand", teamId: teamA });
  expect(list[0].status).toBe("draft");
  expect(list[0]).not.toHaveProperty("departmentId");
});

test("createJobPostingDraft rejects an archived team", async () => {
  const archived = await insertTeam(orgA, true);
  await expect(
    createJobPostingDraft({ title: "X", teamId: archived }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("createJobPostingDraft rejects a team from another org", async () => {
  const foreign = await insertTeam(orgB);
  await expect(
    createJobPostingDraft({ title: "X", teamId: foreign }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("updateJobPosting sanitizes rich text before storing", async () => {
  const id = await createJobPostingDraft({ title: "T", teamId: teamA });
  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    description: "<p>Hallo</p><script>alert(1)</script>",
    tasks: '<p onclick="evil()">Aufgabe</p><iframe src="x"></iframe>',
    requirements: '<a href="javascript:alert(1)">Link</a>',
  });

  const posting = await getJobPostingById(id);
  expect(posting.description).toBe("<p>Hallo</p>");
  expect(posting.tasks).toBe("<p>Aufgabe</p>");
  expect(posting.tasks).not.toContain("iframe");
  expect(posting.requirements).not.toContain("javascript");
});

test("updateJobPosting can edit content while published", async () => {
  const id = await createJobPostingDraft({ title: "Alt", teamId: teamA });
  await (
    await jobPostings()
  ).updateOne({ _id: id }, { $set: { status: "published" } });
  await updateJobPosting({ jobPostingId: id, title: "Neu", teamId: teamA });

  const posting = await getJobPostingById(id);
  expect(posting.title).toBe("Neu");
  expect(posting.status).toBe("published");
});

test("updateJobPosting stores unique organization members as contacts", async () => {
  const firstContact = await insertMember(orgA, { name: "Erster Kontakt" });
  const secondContact = await insertMember(orgA, { name: "Zweiter Kontakt" });
  const id = await createJobPostingDraft({ title: "Alt", teamId: teamA });

  await updateJobPosting({
    jobPostingId: id,
    title: "Neu",
    teamId: teamA,
    contactUserIds: [firstContact, firstContact, secondContact],
  });

  const posting = await getJobPostingById(id);
  expect(posting.contactUserIds).toEqual([firstContact, secondContact]);
});

test("updateJobPosting rejects unavailable contacts", async () => {
  const foreignContact = await insertMember(orgB);
  const offboardedContact = await insertMember(orgA, {
    memberStatus: "offboarded",
  });
  const contactWithoutEmail = await insertMember(orgA, { email: undefined });
  const id = await createJobPostingDraft({ title: "T", teamId: teamA });

  for (const contactUserId of [
    foreignContact,
    offboardedContact,
    contactWithoutEmail,
  ]) {
    await expect(
      updateJobPosting({
        jobPostingId: id,
        title: "T",
        teamId: teamA,
        contactUserIds: [contactUserId],
      }),
    ).rejects.toThrow("Ansprechpartner nicht verfügbar");
  }
});

test("cannot touch or read a posting from another org", async () => {
  const foreignTeam = await insertTeam(orgB);
  const foreign = newId();
  await (
    await jobPostings()
  ).insertOne({
    _id: foreign,
    _creationTime: Date.now(),
    organizationId: orgB,
    teamId: foreignTeam,
    status: "draft",
    title: "Fremd",
    createdBy: newId(),
  });

  await expect(
    updateJobPosting({ jobPostingId: foreign, title: "Hack", teamId: teamA }),
  ).rejects.toThrow("Access denied");
  await expect(getJobPostingById(foreign)).rejects.toThrow("No access");
});
