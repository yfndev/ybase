import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("../tally/client", () => ({ createConfiguredTallyClient: vi.fn() }));
vi.mock("../tally/config", () => ({ loadTallyFormConfig: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { jobPostings, logs } from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPosting } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { createConfiguredTallyClient } from "../tally/client";
import { loadTallyFormConfig } from "../tally/config";
import { generateTallyForm } from "./tallyForm";

let orgA: string;
let orgB: string;
let userA: string;

const emailBlock = {
  uuid: "email-uuid",
  type: "INPUT_EMAIL",
  groupUuid: "g",
  groupType: "INPUT_EMAIL",
};

const phoneBlock = {
  uuid: "phone-uuid",
  type: "INPUT_PHONE_NUMBER",
  groupUuid: "phone-group",
  groupType: "INPUT_PHONE_NUMBER",
  payload: { isRequired: false },
};

const formTitleBlock = {
  uuid: "title-uuid",
  type: "FORM_TITLE",
  groupUuid: "title-group",
  groupType: "FORM_TITLE",
  payload: { title: "VORLAGE", html: "VORLAGE" },
};

const roleHeadingBlock = {
  uuid: "role-heading-uuid",
  type: "HEADING_2",
  groupUuid: "role-heading-group",
  groupType: "HEADING_2",
  payload: { safeHTMLSchema: [["Deine Stelle: XXX"]] },
};

const specificQuestionLabelBlock = {
  uuid: "specific-question-label-uuid",
  type: "LABEL",
  groupUuid: "specific-question-label-group",
  groupType: "LABEL",
  payload: { safeHTMLSchema: [["Spezifische Frage 1"]] },
};

const specificQuestionInputBlock = {
  uuid: "specific-question-input-uuid",
  type: "TEXTAREA",
  groupUuid: "specific-question-input-group",
  groupType: "TEXTAREA",
  payload: { isRequired: true, placeholder: "5 - 8 Zeilen" },
};

const nextSectionBlock = {
  uuid: "next-section-uuid",
  type: "HEADING_2",
  groupUuid: "next-section-group",
  groupType: "HEADING_2",
  payload: { safeHTMLSchema: [["Entrepreneurial Mindset"]] },
};

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    getForm: vi.fn(async () => ({
      id: "tpl",
      status: "PUBLISHED",
      workspaceId: "ws",
      blocks: [
        formTitleBlock,
        emailBlock,
        phoneBlock,
        roleHeadingBlock,
        specificQuestionLabelBlock,
        specificQuestionInputBlock,
        nextSectionBlock,
      ],
      settings: {},
    })),
    createForm: vi.fn(async () => ({ id: "form-1" })),
    updateForm: vi.fn(async () => {}),
    publishForm: vi.fn(async () => {}),
    createWebhook: vi.fn(async () => ({ id: "wh-1" })),
    updateWebhook: vi.fn(async () => {}),
    ...overrides,
  };
}

function useClient(client: ReturnType<typeof fakeClient>) {
  vi.mocked(createConfiguredTallyClient).mockReturnValue(
    client as unknown as ReturnType<typeof createConfiguredTallyClient>,
  );
  return client;
}

async function insertDraft(
  organizationId: string,
  overrides: Partial<JobPosting> = {},
): Promise<string> {
  const _id = newId();
  await (
    await jobPostings()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "draft",
    title: "Vorstand",
    createdBy: userA,
    ...overrides,
  });
  return _id;
}

function find(id: string) {
  return jobPostings().then((c) => c.findOne({ _id: id }));
}

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({
      _id: userA,
      organizationId: orgA,
      role: "people_culture",
    }),
  );
  vi.mocked(loadTallyFormConfig).mockReturnValue({
    workspaceId: "ws",
    templateFormId: "tpl-general",
    webhookUrl: "https://ybase.test/api/tally/webhook",
    webhookSigningSecret: "secret",
  });
});

test("creates, configures, publishes and stores the tally ids", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });

  const posting = await find(id);
  expect(posting?.tallyFormId).toBe("form-1");
  expect(posting?.tallyWebhookId).toBe("wh-1");
  expect(posting?.status).toBe("published");
  expect(posting?.tallyClosed).toBe(false);
  expect(posting?.tallyFormError).toBeUndefined();
  expect(client.createForm).toHaveBeenCalledTimes(1);
  expect(client.createForm).toHaveBeenCalledWith(
    expect.objectContaining({
      templateId: "tpl-general",
      blocks: expect.arrayContaining([
        expect.objectContaining({
          type: "FORM_TITLE",
          payload: expect.objectContaining({
            title:
              "Baue das Young Founders Network mit auf: Bewerbung als Vorstand",
            safeHTMLSchema: [
              [
                "Baue das Young Founders Network mit auf: Bewerbung als Vorstand",
              ],
            ],
          }),
        }),
        expect.objectContaining({
          type: "HEADING_2",
          payload: expect.objectContaining({
            safeHTMLSchema: [["Deine Stelle: Vorstand"]],
          }),
        }),
        expect.objectContaining({
          type: "LABEL",
          payload: expect.objectContaining({
            safeHTMLSchema: [["Was reizt dich besonders an dieser Rolle?"]],
          }),
        }),
        expect.objectContaining({
          type: "INPUT_PHONE_NUMBER",
          payload: expect.objectContaining({ isRequired: true }),
        }),
      ]),
    }),
  );
  expect(client.publishForm).toHaveBeenCalledTimes(1);
  expect(client.updateForm).toHaveBeenCalledWith(
    "form-1",
    expect.objectContaining({
      name: "Baue das Young Founders Network mit auf: Bewerbung als Vorstand",
      settings: { uniqueSubmissionKey: "email-uuid", isClosed: false },
    }),
  );
  const publishLog = await (
    await logs()
  ).findOne({
    entityId: id,
    action: "jobPosting.tally.publish",
  });
  expect(publishLog).toMatchObject({
    details: "Manuell",
    userId: userA,
    _creationTime: expect.any(Number),
  });
});

test("uses the template selected for the posting", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA, {
    tallyTemplateFormId: "tpl-selected",
  });

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });

  expect(client.getForm).toHaveBeenCalledWith("tpl-selected");
  expect(client.createForm).toHaveBeenCalledWith(
    expect.objectContaining({ templateId: "tpl-selected" }),
  );
});

test("syncs posting content and exact role questions into Tally", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA, {
    shortText: "Gestalte unsere technische Plattform.",
    description: "<p>Du entwickelst YBase weiter.</p>",
    tasks: "<ul><li>Architektur gestalten</li></ul>",
    requirements: "<p>Erfahrung mit TypeScript</p>",
    timeCommitment: "5 Stunden pro Woche",
    location: "Remote",
    deadline: "2026-08-31",
    applicationQuestions: ["Welche Architektur hast du zuletzt gestaltet?"],
  });

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });

  const updateFormCalls = client.updateForm.mock.calls as unknown as Array<
    [string, { blocks?: unknown }]
  >;
  const patch = updateFormCalls[0]?.[1];
  const serialized = JSON.stringify(patch?.blocks);
  expect(serialized).toContain("Über die Rolle");
  expect(serialized).toContain("Du entwickelst YBase weiter.");
  expect(serialized).toContain("Aufgaben");
  expect(serialized).toContain("Anforderungen");
  expect(serialized).toContain("Rahmenbedingungen");
  expect(serialized).toContain("Welche Architektur hast du zuletzt gestaltet?");
  expect(serialized).not.toContain("Spezifische Frage");
});

test("publishing syncs the title and preserves other manual Tally changes", async () => {
  const customTitle = {
    ...formTitleBlock,
    payload: { title: "Mein eigener Titel", html: "Mein eigener Titel" },
  };
  const customText = {
    uuid: "custom-text",
    type: "TEXT",
    groupUuid: "custom-text-group",
    groupType: "TEXT",
    payload: { text: "Manuell ergänzt" },
  };
  const client = useClient(
    fakeClient({
      getForm: vi.fn(async () => ({
        id: "form-existing",
        status: "DRAFT",
        workspaceId: "ws",
        blocks: [customTitle, customText, emailBlock, phoneBlock],
        settings: {},
      })),
    }),
  );
  const id = await insertDraft(orgA, {
    tallyFormId: "form-existing",
    tallyWebhookId: "wh-existing",
  });

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });

  expect(client.createForm).not.toHaveBeenCalled();
  expect(client.updateForm).toHaveBeenCalledWith(
    "form-existing",
    expect.objectContaining({
      name: "Baue das Young Founders Network mit auf: Bewerbung als Vorstand",
      blocks: expect.arrayContaining([
        expect.objectContaining({
          type: "FORM_TITLE",
          payload: expect.objectContaining({
            title:
              "Baue das Young Founders Network mit auf: Bewerbung als Vorstand",
          }),
        }),
        customText,
      ]),
    }),
  );
  expect(client.publishForm).toHaveBeenCalledWith("form-existing");
  expect(client.updateWebhook).toHaveBeenCalledWith("wh-existing", {
    formId: "form-existing",
    url: "https://ybase.test/api/tally/webhook",
    signingSecret: "secret",
  });
});

test("returns errors for incomplete or expired drafts before calling Tally", async () => {
  const client = useClient(fakeClient());
  const incomplete = await insertDraft(orgA, { title: "" });
  const expired = await insertDraft(orgA, { deadline: "2000-01-01" });

  await expect(
    generateTallyForm({ jobPostingId: incomplete }),
  ).resolves.toEqual({
    ok: false,
    error: "Titel und Team sind vor der Veröffentlichung erforderlich",
  });
  await expect(generateTallyForm({ jobPostingId: expired })).resolves.toEqual({
    ok: false,
    error: "Die Frist liegt in der Vergangenheit",
  });
  expect(client.getForm).not.toHaveBeenCalled();
});

test("returns an error when the tally configuration is incomplete", async () => {
  const client = useClient(fakeClient());
  vi.mocked(loadTallyFormConfig).mockImplementation(() => {
    throw new Error("Tally-Formularkonfiguration ist unvollständig");
  });
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Tally-Formularkonfiguration ist unvollständig",
  });
  expect(client.createForm).not.toHaveBeenCalled();
  const posting = await find(id);
  expect(posting?.tallyFormId).toBeUndefined();
  expect(posting?.tallyFormError).toContain("unvollständig");
});

test("keeps a repairable draft when the template has no email field", async () => {
  const client = useClient(
    fakeClient({
      getForm: vi.fn(async () => ({
        id: "tpl",
        status: "PUBLISHED",
        workspaceId: "ws",
        blocks: [
          phoneBlock,
          {
            uuid: "u",
            type: "INPUT_TEXT",
            groupUuid: "g",
            groupType: "INPUT_TEXT",
          },
        ],
        settings: {},
      })),
    }),
  );
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Die Vorlage enthält kein E-Mail-Feld",
  });
  const posting = await find(id);
  expect(client.createForm).not.toHaveBeenCalled();
  expect(posting?.status).toBe("draft");
  expect(posting?.tallyFormError).toContain("E-Mail-Feld");
});

test("retry after a webhook failure reuses the existing form", async () => {
  const client = useClient(
    fakeClient({
      createWebhook: vi
        .fn()
        .mockRejectedValueOnce(new Error("Tally API request failed (500)"))
        .mockResolvedValue({ id: "wh-1" }),
    }),
  );
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Tally API request failed (500)",
  });
  let posting = await find(id);
  expect(posting?.tallyFormId).toBe("form-1");
  expect(posting?.tallyWebhookId).toBeUndefined();
  expect(posting?.status).toBe("draft");
  expect(posting?.tallyFormError).toContain("500");

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });
  posting = await find(id);
  expect(client.createForm).toHaveBeenCalledTimes(1);
  expect(posting?.tallyWebhookId).toBe("wh-1");
  expect(posting?.status).toBe("published");
  expect(posting?.tallyFormError).toBeUndefined();
});

test("retry after a publish failure reuses form and webhook", async () => {
  const client = useClient(
    fakeClient({
      publishForm: vi
        .fn()
        .mockRejectedValueOnce(new Error("Tally API request failed (500)"))
        .mockResolvedValue(undefined),
    }),
  );
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Tally API request failed (500)",
  });
  expect((await find(id))?.tallyWebhookId).toBe("wh-1");
  expect((await find(id))?.status).toBe("draft");

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });
  expect(client.createForm).toHaveBeenCalledTimes(1);
  expect(client.createWebhook).toHaveBeenCalledTimes(1);
  expect((await find(id))?.status).toBe("published");
});

test("does not create a second form on repeated calls", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });
  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Nur Entwürfe können ein Tally-Formular erhalten",
  });
  expect(client.createForm).toHaveBeenCalledTimes(1);
});

test("records a repairable draft when the tally api fails", async () => {
  const client = useClient(
    fakeClient({
      createForm: vi
        .fn()
        .mockRejectedValue(new Error("Tally API request failed (500)")),
    }),
  );
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: false,
    error: "Tally API request failed (500)",
  });
  const posting = await find(id);
  expect(posting?.status).toBe("draft");
  expect(posting?.tallyFormId).toBeUndefined();
  expect(posting?.tallyFormError).toContain("500");
  expect(client.publishForm).not.toHaveBeenCalled();
});

test("clears a previous error after a successful run", async () => {
  useClient(fakeClient());
  const id = await insertDraft(orgA, { tallyFormError: "vorheriger Fehler" });

  await expect(generateTallyForm({ jobPostingId: id })).resolves.toEqual({
    ok: true,
  });
  const posting = await find(id);
  expect(posting?.tallyFormError).toBeUndefined();
  expect(posting?.status).toBe("published");
});

test("rejects a posting from another organization", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgB);

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow(
    "Access denied",
  );
  expect(client.getForm).not.toHaveBeenCalled();
});

test("rejects an unauthorized role", async () => {
  useClient(fakeClient());
  vi.mocked(requirePermission).mockRejectedValue(
    new Error(
      "Insufficient permissions. Required permission: manage_recruiting",
    ),
  );
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow(
    "Insufficient permissions",
  );
});
