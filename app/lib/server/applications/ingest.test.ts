import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { getClient, getDb } from "../../db/client";
import {
  applications,
  jobPostings,
  tallyWebhookEvents,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { JobPosting } from "../../db/types";
import { ensureIndexes } from "../../db/indexes";
import { ingestTallySubmission } from "./ingest";
import { tallyWebhookSchema } from "./tallyPayload";

let mongod: MongoMemoryServer;
let orgA: string;
let postingA: string;
let postingA2: string;

function buildPayload(input: {
  eventId: string;
  submissionId: string;
  jobPostingId?: string;
  email?: string;
  formId?: string;
  files?: Array<Record<string, unknown>>;
}) {
  const fields: Array<Record<string, unknown>> = [
    { key: "q1", label: "Vorname", type: "INPUT_TEXT", value: "Max" },
    { key: "q2", label: "Nachname", type: "INPUT_TEXT", value: "Mustermann" },
    {
      key: "q3",
      label: "Motivation",
      type: "TEXTAREA",
      value: "Ich will helfen",
    },
    {
      key: "q-phone",
      label: "Telefon",
      type: "INPUT_PHONE_NUMBER",
      value: "+49123456789",
    },
  ];
  if (input.jobPostingId !== undefined) {
    fields.unshift({
      key: "hf",
      label: "jobPostingId",
      type: "HIDDEN_FIELDS",
      value: input.jobPostingId,
    });
  }
  if (input.email !== undefined) {
    fields.push({
      key: "q4",
      label: "E-Mail",
      type: "INPUT_EMAIL",
      value: input.email,
    });
  }
  if (input.files !== undefined) {
    fields.push({
      key: "q-file",
      label: "Lebenslauf",
      type: "FILE_UPLOAD",
      value: input.files,
    });
  }
  return tallyWebhookSchema.parse({
    eventId: input.eventId,
    eventType: "FORM_RESPONSE",
    data: {
      responseId: `res-${input.eventId}`,
      submissionId: input.submissionId,
      formId: input.formId ?? "form-1",
      fields,
    },
  });
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
    createdBy: newId(),
    tallyFormId: "form-1",
    ...overrides,
  });
  return _id;
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
  await ensureIndexes();
  orgA = newId();
  postingA = await insertPosting(orgA);
  postingA2 = await insertPosting(orgA);
});

test("creates a received application scoped to the posting org with a snapshot", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "Max@Example.com",
      files: [
        {
          id: "file-1",
          name: "cv.pdf",
          url: "https://storage.tally.so/private/cv.pdf?token=secret",
          mimeType: "application/pdf",
          size: 123,
        },
      ],
    }),
  );

  expect(outcome).toEqual({
    status: "created",
    applicationId: expect.any(String),
  });
  const stored = await (
    await applications()
  ).findOne({ jobPostingId: postingA });
  expect(stored?.status).toBe("received");
  expect(stored?.organizationId).toBe(orgA);
  expect(stored?.applicantEmailNormalized).toBe("max@example.com");
  expect(stored?.applicantName).toBe("Max Mustermann");
  expect(stored?.fields).toHaveLength(5);
  expect(stored?.files).toEqual([
    expect.objectContaining({
      fileName: "cv.pdf",
      status: "pending",
      attempts: 0,
    }),
  ]);
  expect(stored?.fields.find((field) => field.key === "q-file")?.value).toEqual(
    ["cv.pdf"],
  );
  expect(stored).not.toHaveProperty("applicantPhone");
  expect(stored?.fields.some((field) => field.type.includes("PHONE"))).toBe(
    false,
  );
  expect(JSON.stringify(stored)).not.toContain("+49123456789");
});

test("ignores a submission without the hidden job posting id", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({ eventId: "e1", submissionId: "s1", email: "a@b.de" }),
  );
  expect(outcome).toEqual({
    status: "ignored",
    reason: "missing-job-posting-id",
  });
  expect(await (await applications()).countDocuments()).toBe(0);
});

test("ignores an unknown job posting id", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: "does-not-exist",
      email: "a@b.de",
    }),
  );
  expect(outcome).toEqual({ status: "ignored", reason: "unknown-job-posting" });
});

test("ignores a submission from a different form", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
      formId: "form-2",
    }),
  );
  expect(outcome).toEqual({
    status: "ignored",
    reason: "form-job-posting-mismatch",
  });
  expect(await (await applications()).countDocuments()).toBe(0);
});

test("ignores a submission without an email", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({ eventId: "e1", submissionId: "s1", jobPostingId: postingA }),
  );
  expect(outcome).toEqual({ status: "ignored", reason: "missing-email" });
  expect(await (await applications()).countDocuments()).toBe(0);
});

test.each(["draft", "closed", "archived"] as const)(
  "ignores a submission for a %s posting",
  async (status) => {
    const posting = await insertPosting(orgA, { status });
    const outcome = await ingestTallySubmission(
      buildPayload({
        eventId: `event-${status}`,
        submissionId: `submission-${status}`,
        jobPostingId: posting,
        email: "a@b.de",
      }),
    );

    expect(outcome).toEqual({
      status: "ignored",
      reason: "job-posting-not-open",
    });
    expect(await (await applications()).countDocuments()).toBe(0);
  },
);

test("ignores a submission when the deadline has already passed", async () => {
  const posting = await insertPosting(orgA, { deadline: "2000-01-01" });
  const outcome = await ingestTallySubmission(
    buildPayload({
      eventId: "event-expired",
      submissionId: "submission-expired",
      jobPostingId: posting,
      email: "a@b.de",
    }),
  );

  expect(outcome).toEqual({
    status: "ignored",
    reason: "job-posting-expired",
  });
  expect(await (await applications()).countDocuments()).toBe(0);
});

test("de-duplicates a repeated delivery of the same event", async () => {
  const payload = buildPayload({
    eventId: "e1",
    submissionId: "s1",
    jobPostingId: postingA,
    email: "a@b.de",
  });
  await ingestTallySubmission(payload);
  const second = await ingestTallySubmission(payload);

  expect(second).toEqual({ status: "duplicate" });
  expect(await (await applications()).countDocuments()).toBe(1);
});

test("de-duplicates concurrent deliveries and keeps the event processed", async () => {
  const payload = buildPayload({
    eventId: "e1",
    submissionId: "s1",
    jobPostingId: postingA,
    email: "a@b.de",
  });

  const outcomes = await Promise.all([
    ingestTallySubmission(payload),
    ingestTallySubmission(payload),
  ]);

  expect(outcomes.map((outcome) => outcome.status).sort()).toEqual([
    "created",
    "duplicate",
  ]);
  expect(await (await applications()).countDocuments()).toBe(1);
  const event = await (await tallyWebhookEvents()).findOne({ _id: "e1" });
  expect(event?.status).toBe("processed");
  expect(event?.applicationId).toBeTruthy();
});

test("de-duplicates the same submission arriving under a different event", async () => {
  await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
    }),
  );
  const second = await ingestTallySubmission(
    buildPayload({
      eventId: "e2",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
    }),
  );

  expect(second).toEqual({ status: "duplicate" });
  expect(await (await applications()).countDocuments()).toBe(1);
  const event = await (await tallyWebhookEvents()).findOne({ _id: "e2" });
  expect(event?.status).toBe("duplicate");
  expect(event?.applicationId).toBeTruthy();
});

test("de-duplicates the same response arriving as another submission", async () => {
  const first = buildPayload({
    eventId: "e1",
    submissionId: "s1",
    jobPostingId: postingA,
    email: "first@b.de",
  });
  await ingestTallySubmission(first);

  const second = buildPayload({
    eventId: "e2",
    submissionId: "s2",
    jobPostingId: postingA,
    email: "second@b.de",
  });
  second.data.responseId = first.data.responseId;

  await expect(ingestTallySubmission(second)).resolves.toEqual({
    status: "duplicate",
  });
  expect(await (await applications()).countDocuments()).toBe(1);
});

test("allows one email to apply only once per posting", async () => {
  await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
    }),
  );
  const again = await ingestTallySubmission(
    buildPayload({
      eventId: "e2",
      submissionId: "s2",
      jobPostingId: postingA,
      email: "A@B.de",
    }),
  );

  expect(again).toEqual({ status: "duplicate" });
  expect(
    await (await applications()).countDocuments({ jobPostingId: postingA }),
  ).toBe(1);
});

test("lets the same email apply to a different posting", async () => {
  await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
    }),
  );
  const other = await ingestTallySubmission(
    buildPayload({
      eventId: "e2",
      submissionId: "s2",
      jobPostingId: postingA2,
      email: "a@b.de",
    }),
  );

  expect(other.status).toBe("created");
  expect(await (await applications()).countDocuments()).toBe(2);
});

test("records the event outcome for traceability", async () => {
  const outcome = await ingestTallySubmission(
    buildPayload({
      eventId: "e1",
      submissionId: "s1",
      jobPostingId: postingA,
      email: "a@b.de",
    }),
  );
  const event = await (await tallyWebhookEvents()).findOne({ _id: "e1" });
  expect(event?.status).toBe("processed");
  expect(event?.applicationId).toBe(
    outcome.status === "created" ? outcome.applicationId : undefined,
  );
  expect(event?.organizationId).toBe(orgA);
});
