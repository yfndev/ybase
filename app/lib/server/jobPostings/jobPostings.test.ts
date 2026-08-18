import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("./tallyFormProvisioning", () => ({
  provisionTallyFormDraft: vi.fn(async () => ({ ok: true, formId: "form-1" })),
}));
vi.mock("./tallyTemplates", () => ({
  requireRecruitingTallyTemplate: vi.fn(async (id: string) => ({
    id,
    name: "Vorlage",
  })),
}));

import { requirePermission, requireUser } from "../../auth/session";
import { departments, jobPostings, teams, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { DEFAULT_JOB_POSTING_BENEFITS } from "../../jobPostings/benefits";
import { berlinToday } from "../../jobPostings/deadline";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { createJobPostingDraft, updateJobPosting } from "./actions";
import { getJobPostingById, getJobPostings } from "./data";
import { provisionTallyFormDraft } from "./tallyFormProvisioning";
import { requireRecruitingTallyTemplate } from "./tallyTemplates";

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

function becomeTeamLead(teamId: string, secondaryTeamId?: string) {
  const actor = createTestActor({
    _id: userA,
    organizationId: orgA,
    role: "team_lead",
    teamId,
    secondaryTeamId,
  });
  vi.mocked(requireUser).mockResolvedValue(actor);
  vi.mocked(requirePermission).mockResolvedValue(actor);
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
  const id = await createJobPostingDraft({
    title: "Vorstand",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });
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
  expect(list[0]).toMatchObject({
    _id: id,
    title: "Vorstand",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
    urgency: "normal",
    shortText:
      "Baue mit uns die größte Community für junge (angehende) Gründer:innen im deutschsprachigen Raum auf.",
    benefits: DEFAULT_JOB_POSTING_BENEFITS,
    requirements: "<ul><li>Alter (&lt;25 Jahre)</li></ul>",
  });
  expect(list[0].status).toBe("draft");
  expect(list[0]).not.toHaveProperty("departmentId");
  expect(provisionTallyFormDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      _id: id,
      title: "Vorstand",
      status: "draft",
      tallyTemplateFormId: "template-1",
    }),
    expect.objectContaining({ _id: userA, organizationId: orgA }),
  );
  expect(requireRecruitingTallyTemplate).toHaveBeenCalledWith("template-1");
});

test("createJobPostingDraft stores urgent postings", async () => {
  const id = await createJobPostingDraft({
    title: "Dringende Unterstützung",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
    urgency: "urgent",
  });

  expect(await getJobPostingById(id)).toMatchObject({
    title: "Dringende Unterstützung",
    urgency: "urgent",
  });
});

test("createJobPostingDraft rejects an archived team", async () => {
  const archived = await insertTeam(orgA, true);
  await expect(
    createJobPostingDraft({
      title: "X",
      teamId: archived,
      tallyTemplateFormId: "template-1",
    }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("createJobPostingDraft rejects a team from another org", async () => {
  const foreign = await insertTeam(orgB);
  await expect(
    createJobPostingDraft({
      title: "X",
      teamId: foreign,
      tallyTemplateFormId: "template-1",
    }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("createJobPostingDraft rejects a form outside the templates folder", async () => {
  vi.mocked(requireRecruitingTallyTemplate).mockRejectedValueOnce(
    new Error("Tally-Vorlage nicht verfügbar"),
  );

  await expect(
    createJobPostingDraft({
      title: "X",
      teamId: teamA,
      tallyTemplateFormId: "foreign-form",
    }),
  ).rejects.toThrow("Tally-Vorlage nicht verfügbar");
  expect(await (await jobPostings()).countDocuments()).toBe(0);
  expect(provisionTallyFormDraft).not.toHaveBeenCalled();
});

test("updateJobPosting sanitizes rich text before storing", async () => {
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });
  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    description: "<p>Hallo</p><script>alert(1)</script>",
    tasks: '<p onclick="evil()">Aufgabe</p><iframe src="x"></iframe>',
    requirements: '<a href="javascript:alert(1)">Link</a>',
    benefits: "<ul><li>Community</li></ul><script>alert(1)</script>",
  });

  const posting = await getJobPostingById(id);
  expect(posting.description).toBe("<p>Hallo</p>");
  expect(posting.tasks).toBe("<p>Aufgabe</p>");
  expect(posting.tasks).not.toContain("iframe");
  expect(posting.requirements).not.toContain("javascript");
  expect(posting.benefits).toBe("<ul><li>Community</li></ul>");
  expect(provisionTallyFormDraft).toHaveBeenLastCalledWith(
    expect.objectContaining({
      _id: id,
      title: "T",
      description: "<p>Hallo</p>",
    }),
    expect.objectContaining({ _id: userA, organizationId: orgA }),
  );
});

test("updateJobPosting can edit content while published", async () => {
  const id = await createJobPostingDraft({
    title: "Alt",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });
  await (
    await jobPostings()
  ).updateOne(
    { _id: id },
    { $set: { status: "published", tallyFormId: "form-1" } },
  );
  await updateJobPosting({ jobPostingId: id, title: "Neu", teamId: teamA });

  const posting = await getJobPostingById(id);
  expect(posting.title).toBe("Neu");
  expect(posting.status).toBe("published");
  expect(provisionTallyFormDraft).toHaveBeenCalledTimes(2);
  expect(provisionTallyFormDraft).toHaveBeenLastCalledWith(
    expect.objectContaining({
      _id: id,
      title: "Neu",
      status: "published",
      tallyFormId: "form-1",
    }),
    expect.objectContaining({ _id: userA, organizationId: orgA }),
  );
});

test("updateJobPosting only accepts empty or future deadlines", async () => {
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

  await expect(
    updateJobPosting({
      jobPostingId: id,
      title: "T",
      teamId: teamA,
      deadline: berlinToday(),
    }),
  ).rejects.toThrow("Die Frist muss in der Zukunft liegen");

  await expect(
    updateJobPosting({
      jobPostingId: id,
      title: "T",
      teamId: teamA,
      deadline: "2000-01-01",
    }),
  ).rejects.toThrow("Die Frist muss in der Zukunft liegen");

  await expect(
    updateJobPosting({
      jobPostingId: id,
      title: "T",
      teamId: teamA,
      deadline: "keine-frist",
    }),
  ).rejects.toThrow("Die Frist muss in der Zukunft liegen");

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    deadline: "2999-12-31",
  });
  expect((await getJobPostingById(id)).deadline).toBe("2999-12-31");

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    deadline: "",
  });
  expect((await getJobPostingById(id)).deadline).toBe("");
});

test("updateJobPosting changes the urgency", async () => {
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    urgency: "urgent",
  });

  expect((await getJobPostingById(id)).urgency).toBe("urgent");
});

test("updateJobPosting only accepts canonical time commitments", async () => {
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

  await expect(
    updateJobPosting({
      jobPostingId: id,
      title: "T",
      teamId: teamA,
      // @ts-expect-error Exercise validation for untyped server-action callers.
      timeCommitment: "5 Stunden pro Woche",
    }),
  ).rejects.toThrow();

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    timeCommitment: "Zwischen 4 und 8 Stunden",
  });
  expect((await getJobPostingById(id)).timeCommitment).toBe(
    "Zwischen 4 und 8 Stunden",
  );
});

test("stores the exact application questions and forwards them to Tally", async () => {
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });
  const applicationQuestions = [
    "Welche Systeme hast du skaliert?",
    "Wie führst du ein technisches Team?",
  ];

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    applicationQuestions,
  });

  const posting = await getJobPostingById(id);
  expect(posting.applicationQuestions).toEqual(applicationQuestions);
  expect(provisionTallyFormDraft).toHaveBeenLastCalledWith(
    expect.objectContaining({ _id: id, applicationQuestions }),
    expect.objectContaining({ _id: userA, organizationId: orgA }),
  );
});

test("updateJobPosting stores unique organization members as contacts", async () => {
  const firstContact = await insertMember(orgA, { name: "Erster Kontakt" });
  const secondContact = await insertMember(orgA, { name: "Zweiter Kontakt" });
  const id = await createJobPostingDraft({
    title: "Alt",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

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
  const offboardingContact = await insertMember(orgA, {
    memberStatus: "offboarding",
  });
  const archivedContact = await insertMember(orgA, {
    memberStatus: "archived",
  });
  const contactWithoutEmail = await insertMember(orgA, { email: undefined });
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

  for (const contactUserId of [
    foreignContact,
    offboardedContact,
    offboardingContact,
    archivedContact,
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

test("updateJobPosting keeps planned offboarding contacts available", async () => {
  const contactId = await insertMember(orgA, {
    memberStatus: "offboarding_planned",
  });
  const id = await createJobPostingDraft({
    title: "T",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });

  await updateJobPosting({
    jobPostingId: id,
    title: "T",
    teamId: teamA,
    contactUserIds: [contactId],
  });

  expect((await getJobPostingById(id)).contactUserIds).toEqual([contactId]);
});

test("a team lead only sees and edits postings of their own teams", async () => {
  const secondaryTeam = await insertTeam(orgA);
  const otherTeam = await insertTeam(orgA);
  const ownPosting = await createJobPostingDraft({
    title: "Eigenes Team",
    teamId: teamA,
    tallyTemplateFormId: "template-1",
  });
  const secondaryPosting = await createJobPostingDraft({
    title: "Zweitteam",
    teamId: secondaryTeam,
    tallyTemplateFormId: "template-1",
  });
  const foreignPosting = await createJobPostingDraft({
    title: "Fremdes Team",
    teamId: otherTeam,
    tallyTemplateFormId: "template-1",
  });
  becomeTeamLead(teamA, secondaryTeam);

  const list = await getJobPostings();
  expect(list.map(({ _id }) => _id).sort()).toEqual(
    [ownPosting, secondaryPosting].sort(),
  );
  await expect(getJobPostingById(foreignPosting)).rejects.toThrow("No access");
  await expect(
    updateJobPosting({
      jobPostingId: foreignPosting,
      title: "Hack",
      teamId: otherTeam,
    }),
  ).rejects.toThrow("Access denied");
  await expect(
    updateJobPosting({
      jobPostingId: ownPosting,
      title: "Verschoben",
      teamId: otherTeam,
    }),
  ).rejects.toThrow("Team nicht verfügbar");
});

test("a team lead cannot create a draft for another team", async () => {
  const otherTeam = await insertTeam(orgA);
  becomeTeamLead(teamA);

  await expect(
    createJobPostingDraft({
      title: "Fremd",
      teamId: otherTeam,
      tallyTemplateFormId: "template-1",
    }),
  ).rejects.toThrow("Team nicht verfügbar");
  await expect(
    createJobPostingDraft({
      title: "Eigen",
      teamId: teamA,
      tallyTemplateFormId: "template-1",
    }),
  ).resolves.toEqual(expect.any(String));
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
