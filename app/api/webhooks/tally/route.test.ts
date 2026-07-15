import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("next/server", () => ({
  after: vi.fn((callback: () => unknown) => callback()),
}));

vi.mock("@/lib/server/applications/ingest", () => ({
  ingestTallySubmission: vi.fn(),
}));

vi.mock("@/lib/server/applications/email", () => ({
  sendApplicationEmails: vi.fn(),
}));

vi.mock("@/lib/server/applications/fileImport", () => ({
  importApplicationFiles: vi.fn(),
}));

vi.mock(
  "@/lib/server/applications/tallyPayload",
  () => import("../../../lib/server/applications/tallyPayload"),
);

vi.mock(
  "@/lib/server/tally/config",
  () => import("../../../lib/server/tally/config"),
);

vi.mock(
  "@/lib/server/tally/signature",
  () => import("../../../lib/server/tally/signature"),
);

import { after } from "next/server";
import { sendApplicationEmails } from "@/lib/server/applications/email";
import { importApplicationFiles } from "@/lib/server/applications/fileImport";
import { ingestTallySubmission } from "@/lib/server/applications/ingest";
import { POST } from "./route";

const SECRET = "whsec_test_secret";

function payload(eventType = "FORM_RESPONSE") {
  return {
    eventId: "event-1",
    eventType,
    data: {
      responseId: "response-1",
      submissionId: "submission-1",
      formId: "form-1",
      fields: [],
    },
  };
}

function sign(rawBody: string): string {
  return createHmac("sha256", SECRET).update(rawBody, "utf8").digest("base64");
}

function request(rawBody: string, signature?: string): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) headers.set("tally-signature", signature);
  return new Request("http://localhost/api/webhooks/tally", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TALLY_WEBHOOK_SIGNING_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("rejects an unsigned webhook before processing", async () => {
  const response = await POST(request(JSON.stringify(payload())));

  expect(response.status).toBe(401);
  expect(ingestTallySubmission).not.toHaveBeenCalled();
});

test("fails closed when the signing secret is not configured", async () => {
  vi.stubEnv("TALLY_WEBHOOK_SIGNING_SECRET", "");
  const rawBody = JSON.stringify(payload());
  const response = await POST(request(rawBody, sign(rawBody)));

  expect(response.status).toBe(500);
  expect(ingestTallySubmission).not.toHaveBeenCalled();
});

test("rejects a signature that does not match the exact raw body", async () => {
  const signedBody = JSON.stringify(payload());
  const changedBody = `${signedBody} `;
  const response = await POST(request(changedBody, sign(signedBody)));

  expect(response.status).toBe(401);
  expect(ingestTallySubmission).not.toHaveBeenCalled();
});

test("rejects a signed malformed payload before processing", async () => {
  const rawBody = "not-json";
  const response = await POST(request(rawBody, sign(rawBody)));

  expect(response.status).toBe(400);
  expect(ingestTallySubmission).not.toHaveBeenCalled();
});

test("processes a valid signed webhook and schedules follow-up work", async () => {
  const rawBody = JSON.stringify(payload());
  vi.mocked(ingestTallySubmission).mockResolvedValue({
    status: "created",
    applicationId: "application-1",
    withdrawalToken: "withdrawal-token",
  });

  const response = await POST(request(rawBody, sign(rawBody)));

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    ok: true,
    status: "created",
  });
  expect(ingestTallySubmission).toHaveBeenCalledWith(payload());
  expect(after).toHaveBeenCalledOnce();
  expect(sendApplicationEmails).toHaveBeenCalledWith(
    "application-1",
    "withdrawal-token",
  );
  expect(importApplicationFiles).toHaveBeenCalledWith("application-1");
});

test("does not schedule emails for an idempotent duplicate", async () => {
  const rawBody = JSON.stringify(payload());
  vi.mocked(ingestTallySubmission).mockResolvedValue({ status: "duplicate" });

  const response = await POST(request(rawBody, sign(rawBody)));

  await expect(response.json()).resolves.toEqual({
    ok: true,
    status: "duplicate",
  });
  expect(after).not.toHaveBeenCalled();
  expect(sendApplicationEmails).not.toHaveBeenCalled();
  expect(importApplicationFiles).not.toHaveBeenCalled();
});

test("ignores a valid signed event with another type", async () => {
  const rawBody = JSON.stringify(payload("FORM_UPDATED"));
  const response = await POST(request(rawBody, sign(rawBody)));

  await expect(response.json()).resolves.toEqual({
    ok: true,
    status: "ignored",
  });
  expect(ingestTallySubmission).not.toHaveBeenCalled();
  expect(after).not.toHaveBeenCalled();
});
