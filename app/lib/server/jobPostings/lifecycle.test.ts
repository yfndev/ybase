import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));
vi.mock("../tally/client", () => ({ createConfiguredTallyClient: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { getClient, getDb } from "../../db/client";
import { jobPostings, logs } from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPosting } from "../../db/types";
import { createConfiguredTallyClient } from "../tally/client";
import {
  archiveJobPosting,
  closeJobPosting,
  reopenJobPosting,
  retryTallySync,
} from "./lifecycle";
import { closeExpiredJobPostings } from "./tallySync";

let mongod: MongoMemoryServer;
let orgA: string;
let orgB: string;
let userA: string;

const FUTURE = "2999-12-31";
const PAST = "2000-01-01";

function fakeClient(updateForm = vi.fn(async () => {})) {
  const client = { updateForm };
  vi.mocked(createConfiguredTallyClient).mockReturnValue(
    client as unknown as ReturnType<typeof createConfiguredTallyClient>,
  );
  return client;
}

async function insertPosting(
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
    status: "published",
    title: "Vorstand",
    createdBy: userA,
    tallyFormId: "form-1",
    ...overrides,
  });
  return _id;
}

async function read(id: string): Promise<JobPosting> {
  const posting = await (await jobPostings()).findOne({ _id: id });
  if (!posting) throw new Error("not found");
  return posting;
}

async function logsFor(id: string) {
  return (await logs()).find({ entityId: id }).toArray();
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
  const actor = {
    _id: userA,
    _creationTime: Date.now(),
    organizationId: orgA,
    role: "people_culture" as const,
  };
  vi.mocked(requirePermission).mockResolvedValue(actor);
  fakeClient();
});

test("closeJobPosting closes the posting and syncs Tally isClosed", async () => {
  const client = fakeClient();
  const id = await insertPosting(orgA, { status: "published" });

  await closeJobPosting({ jobPostingId: id });

  const posting = await read(id);
  expect(posting.status).toBe("closed");
  expect(posting.tallyClosed).toBe(true);
  expect(client.updateForm).toHaveBeenCalledWith("form-1", {
    settings: { isClosed: true },
  });
  const log = (await logsFor(id)).find((l) => l.action === "jobPosting.close");
  expect(log?.details).toBe("Manuell");
});

test("closeJobPosting rejects a posting that is not published", async () => {
  const id = await insertPosting(orgA, { status: "draft" });
  await expect(closeJobPosting({ jobPostingId: id })).rejects.toThrow(
    "veröffentlichte",
  );
});

test("reopenJobPosting reopens and reopens the Tally form", async () => {
  const client = fakeClient();
  const id = await insertPosting(orgA, {
    status: "closed",
    deadline: FUTURE,
    tallyClosed: true,
  });

  await reopenJobPosting({ jobPostingId: id });

  const posting = await read(id);
  expect(posting.status).toBe("published");
  expect(posting.tallyClosed).toBe(false);
  expect(client.updateForm).toHaveBeenCalledWith("form-1", {
    settings: { isClosed: false },
  });
});

test("reopenJobPosting refuses an expired posting until the deadline is renewed", async () => {
  const id = await insertPosting(orgA, { status: "closed", deadline: PAST });
  await expect(reopenJobPosting({ jobPostingId: id })).rejects.toThrow(
    "Vergangenheit",
  );
  expect((await read(id)).status).toBe("closed");
});

test("archiveJobPosting archives and closes the form", async () => {
  const client = fakeClient();
  const id = await insertPosting(orgA, { status: "closed" });

  await archiveJobPosting({ jobPostingId: id });

  expect((await read(id)).status).toBe("archived");
  expect(client.updateForm).toHaveBeenCalledWith("form-1", {
    settings: { isClosed: true },
  });
});

test("a Tally sync failure is recorded, visible, and retryable idempotently", async () => {
  const updateForm = vi
    .fn()
    .mockRejectedValueOnce(new Error("Tally down"))
    .mockResolvedValue(undefined);
  fakeClient(updateForm);
  const id = await insertPosting(orgA, { status: "published" });

  await expect(closeJobPosting({ jobPostingId: id })).rejects.toThrow(
    "Tally down",
  );

  // ybase is authoritative: status changed even though the sync failed.
  let posting = await read(id);
  expect(posting.status).toBe("closed");
  expect(posting.tallyFormError).toBe("Tally down");
  expect(posting.tallyClosed).toBeUndefined();

  await retryTallySync({ jobPostingId: id });

  posting = await read(id);
  expect(posting.tallyClosed).toBe(true);
  expect(posting.tallyFormError).toBeUndefined();

  // Idempotent: a second retry keeps the same synced state.
  await retryTallySync({ jobPostingId: id });
  expect((await read(id)).tallyClosed).toBe(true);
});

test("closeExpiredJobPostings closes only expired published postings across orgs", async () => {
  const client = fakeClient();
  const expiredA = await insertPosting(orgA, {
    status: "published",
    deadline: PAST,
  });
  const expiredB = await insertPosting(orgB, {
    status: "published",
    deadline: PAST,
  });
  const future = await insertPosting(orgA, {
    status: "published",
    deadline: FUTURE,
  });
  const noDeadline = await insertPosting(orgA, {
    status: "published",
    deadline: "",
  });
  const alreadyClosed = await insertPosting(orgA, {
    status: "closed",
    deadline: PAST,
  });

  const result = await closeExpiredJobPostings();

  expect(result).toEqual({ closed: 2, syncErrors: 0 });
  expect((await read(expiredA)).status).toBe("closed");
  expect((await read(expiredB)).status).toBe("closed");
  expect((await read(future)).status).toBe("published");
  expect((await read(noDeadline)).status).toBe("published");
  expect((await read(alreadyClosed)).status).toBe("closed");
  expect(client.updateForm).toHaveBeenCalledTimes(2);
  const log = (await logsFor(expiredA)).find(
    (l) => l.action === "jobPosting.close",
  );
  expect(log?.details).toBe("Automatisch: Frist erreicht");
  expect(log?.userId).toBe("system");
});

test("lifecycle actions refuse a posting from another org", async () => {
  const foreign = await insertPosting(orgB, { status: "published" });
  await expect(closeJobPosting({ jobPostingId: foreign })).rejects.toThrow(
    "Access denied",
  );
  await expect(archiveJobPosting({ jobPostingId: foreign })).rejects.toThrow(
    "Access denied",
  );
});
