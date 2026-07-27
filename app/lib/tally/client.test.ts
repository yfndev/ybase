import { expect, test, vi } from "vitest";
import { createTallyClient } from "./client";
import { TALLY_API_VERSION } from "./constants";

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("loads a form with a pinned API version", async () => {
  const fetcher = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      json({
        id: "form-a",
        workspaceId: "ws-a",
        status: "PUBLISHED",
        blocks: [],
        settings: {},
      }),
  );
  const client = createTallyClient(
    "token-a",
    fetcher as unknown as typeof fetch,
  );

  const form = await client.getForm("form-a");

  expect(form.workspaceId).toBe("ws-a");
  for (const call of fetcher.mock.calls) {
    const headers = new Headers(call[1]?.headers);
    expect(headers.get("tally-version")).toBe(TALLY_API_VERSION);
    expect(headers.get("authorization")).toBe("Bearer token-a");
  }
});

test("requires a Tally API token", () => {
  expect(() => createTallyClient("")).toThrow("Tally API token is required");
});

test("includes the Tally response message in API errors", async () => {
  const fetcher = vi.fn(async () =>
    Response.json(
      { error: { message: "Invalid block payload" } },
      { status: 400 },
    ),
  );
  const client = createTallyClient("token", fetcher as unknown as typeof fetch);

  await expect(client.getForm("form-1")).rejects.toThrow(
    "Tally API request failed (400): Invalid block payload",
  );
});

function recordingFetch(response: unknown) {
  return vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
    json(response),
  );
}

test("creates a form from a template within a workspace", async () => {
  const fetcher = recordingFetch({ id: "form-1", status: "DRAFT" });
  const client = createTallyClient(
    "token-a",
    fetcher as unknown as typeof fetch,
  );
  const blocks = [
    {
      uuid: "u",
      type: "INPUT_EMAIL",
      groupUuid: "g",
      groupType: "INPUT_EMAIL",
    },
  ];

  const created = await client.createForm({
    templateId: "tpl-1",
    workspaceId: "ws-1",
    blocks,
  });

  expect(created.id).toBe("form-1");
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.tally.so/forms");
  expect(init?.method).toBe("POST");
  expect(JSON.parse(String(init?.body))).toEqual({
    templateId: "tpl-1",
    workspaceId: "ws-1",
    status: "DRAFT",
    blocks,
  });
  const headers = new Headers(init?.headers);
  expect(headers.get("authorization")).toBe("Bearer token-a");
  expect(headers.get("tally-version")).toBe(TALLY_API_VERSION);
});

test("updates blocks and publishes a form", async () => {
  const fetcher = recordingFetch({});
  const client = createTallyClient("t", fetcher as unknown as typeof fetch);

  await client.updateForm("form-1", {
    settings: { uniqueSubmissionKey: "email-1" },
  });
  await client.publishForm("form-1");

  expect(fetcher.mock.calls[0][0]).toBe("https://api.tally.so/forms/form-1");
  expect(fetcher.mock.calls[0][1]?.method).toBe("PATCH");
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
    settings: { uniqueSubmissionKey: "email-1" },
  });
  expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
    status: "PUBLISHED",
  });
});

test("creates a signed FORM_RESPONSE webhook", async () => {
  const fetcher = recordingFetch({ id: "wh-1" });
  const client = createTallyClient("t", fetcher as unknown as typeof fetch);

  const webhook = await client.createWebhook({
    formId: "form-1",
    url: "https://ybase.test/api/tally/webhook",
    signingSecret: "secret",
  });

  expect(webhook.id).toBe("wh-1");
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.tally.so/webhooks");
  expect(JSON.parse(String(init?.body))).toEqual({
    formId: "form-1",
    url: "https://ybase.test/api/tally/webhook",
    eventTypes: ["FORM_RESPONSE"],
    signingSecret: "secret",
  });
});

test("updates and enables a signed FORM_RESPONSE webhook", async () => {
  const fetcher = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  const client = createTallyClient("t", fetcher as unknown as typeof fetch);

  await client.updateWebhook("wh-1", {
    formId: "form-1",
    url: "https://stage-ybase.test/api/webhooks/tally",
    signingSecret: "secret",
  });

  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.tally.so/webhooks/wh-1");
  expect(init?.method).toBe("PATCH");
  expect(JSON.parse(String(init?.body))).toEqual({
    formId: "form-1",
    url: "https://stage-ybase.test/api/webhooks/tally",
    signingSecret: "secret",
    eventTypes: ["FORM_RESPONSE"],
    isEnabled: true,
  });
});

test("deletes a webhook and form without a request body", async () => {
  const fetcher = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(null, { status: 204 }),
  );
  const client = createTallyClient("token", fetcher as unknown as typeof fetch);

  await client.deleteWebhook("webhook-1");
  await client.deleteForm("form-1");

  expect(fetcher.mock.calls).toHaveLength(2);
  expect(fetcher.mock.calls[0][0]).toBe(
    "https://api.tally.so/webhooks/webhook-1",
  );
  expect(fetcher.mock.calls[1][0]).toBe("https://api.tally.so/forms/form-1");
  for (const [, init] of fetcher.mock.calls) {
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
  }
});

test("treats already deleted Tally resources as deleted", async () => {
  const fetcher = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(null, { status: 404 }),
  );
  const client = createTallyClient("token", fetcher as unknown as typeof fetch);

  await expect(client.deleteWebhook("missing")).resolves.toBeUndefined();
  await expect(client.deleteForm("missing")).resolves.toBeUndefined();
});

test("reads a form with its blocks and settings", async () => {
  const fetcher = recordingFetch({
    id: "form-1",
    status: "PUBLISHED",
    workspaceId: "ws-1",
    blocks: [
      {
        uuid: "u",
        type: "INPUT_EMAIL",
        groupUuid: "g",
        groupType: "INPUT_EMAIL",
      },
    ],
    settings: { uniqueSubmissionKey: null },
  });
  const client = createTallyClient("t", fetcher as unknown as typeof fetch);

  const form = await client.getForm("form-1");
  expect(form.workspaceId).toBe("ws-1");
  expect(form.blocks[0].type).toBe("INPUT_EMAIL");
});
