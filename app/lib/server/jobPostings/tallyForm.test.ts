import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("../tally/client", () => ({ createConfiguredTallyClient: vi.fn() }));
vi.mock("../tally/config", () => ({ loadTallyFormConfig: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { jobPostings } from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPosting } from "../../db/types";
import { createConfiguredTallyClient } from "../tally/client";
import { loadTallyFormConfig } from "../tally/config";
import { generateTallyForm } from "./tallyForm";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;

const emailBlock = {
  uuid: "email-uuid",
  type: "INPUT_EMAIL",
  groupUuid: "g",
  groupType: "INPUT_EMAIL",
};

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    getForm: vi.fn(async () => ({
      id: "tpl",
      status: "PUBLISHED",
      workspaceId: "ws",
      blocks: [emailBlock],
      settings: {},
    })),
    createForm: vi.fn(async () => ({ id: "form-1" })),
    updateForm: vi.fn(async () => {}),
    publishForm: vi.fn(async () => {}),
    createWebhook: vi.fn(async () => ({ id: "wh-1" })),
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

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = "ybase_test";
}, 120_000);

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
}, 30_000);

beforeEach(async () => {
  await (await getDb()).dropDatabase();
  vi.clearAllMocks();
  orgA = newId();
  orgB = newId();
  userA = newId();
  vi.mocked(requirePermission).mockResolvedValue({
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "people_culture" as const,
    memberStatus: "active" as const,
    teamOnboardingStatus: "completed" as const,
  });
  vi.mocked(loadTallyFormConfig).mockReturnValue({
    workspaceId: "ws",
    templateFormId: "tpl",
    webhookUrl: "https://ybase.test/api/tally/webhook",
    webhookSigningSecret: "secret",
  });
});

test("creates, configures, publishes and stores the tally ids", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA);

  await generateTallyForm({ jobPostingId: id });

  const posting = await find(id);
  expect(posting?.tallyFormId).toBe("form-1");
  expect(posting?.tallyWebhookId).toBe("wh-1");
  expect(posting?.status).toBe("published");
  expect(posting?.tallyFormError).toBeUndefined();
  expect(client.createForm).toHaveBeenCalledTimes(1);
  expect(client.publishForm).toHaveBeenCalledTimes(1);
  expect(client.updateForm).toHaveBeenCalledWith(
    "form-1",
    expect.objectContaining({
      settings: { uniqueSubmissionKey: "email-uuid" },
    }),
  );
});

test("rejects when the tally configuration is incomplete", async () => {
  const client = useClient(fakeClient());
  vi.mocked(loadTallyFormConfig).mockImplementation(() => {
    throw new Error("Tally-Formularkonfiguration ist unvollständig");
  });
  const id = await insertDraft(orgA);

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow(
    "unvollständig",
  );
  expect(client.createForm).not.toHaveBeenCalled();
  expect((await find(id))?.tallyFormId).toBeUndefined();
});

test("keeps a repairable draft when the template has no email field", async () => {
  const client = useClient(
    fakeClient({
      getForm: vi.fn(async () => ({
        id: "tpl",
        status: "PUBLISHED",
        workspaceId: "ws",
        blocks: [
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

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow(
    "E-Mail-Feld",
  );
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

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow("500");
  let posting = await find(id);
  expect(posting?.tallyFormId).toBe("form-1");
  expect(posting?.tallyWebhookId).toBeUndefined();
  expect(posting?.status).toBe("draft");
  expect(posting?.tallyFormError).toContain("500");

  await generateTallyForm({ jobPostingId: id });
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

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow();
  expect((await find(id))?.tallyWebhookId).toBe("wh-1");
  expect((await find(id))?.status).toBe("draft");

  await generateTallyForm({ jobPostingId: id });
  expect(client.createForm).toHaveBeenCalledTimes(1);
  expect(client.createWebhook).toHaveBeenCalledTimes(1);
  expect((await find(id))?.status).toBe("published");
});

test("does not create a second form on repeated calls", async () => {
  const client = useClient(fakeClient());
  const id = await insertDraft(orgA);

  await generateTallyForm({ jobPostingId: id });
  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow(
    "Entwürfe",
  );
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

  await expect(generateTallyForm({ jobPostingId: id })).rejects.toThrow("500");
  const posting = await find(id);
  expect(posting?.status).toBe("draft");
  expect(posting?.tallyFormId).toBeUndefined();
  expect(posting?.tallyFormError).toContain("500");
  expect(client.publishForm).not.toHaveBeenCalled();
});

test("clears a previous error after a successful run", async () => {
  useClient(fakeClient());
  const id = await insertDraft(orgA, { tallyFormError: "vorheriger Fehler" });

  await generateTallyForm({ jobPostingId: id });
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
