import { expect, test, vi } from "vitest";
import { createTallyClient } from "./client";
import { TALLY_API_VERSION } from "./constants";

function json(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function tallyFetch(options?: {
  requiredPhone?: boolean;
  workspaceId?: string;
}) {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/workspaces") {
      return json({
        items: [{ id: "ws-a", name: "Workspace A" }],
        hasMore: false,
      });
    }
    if (url.pathname === "/forms") {
      return json({
        items: [
          {
            id: "form-a",
            name: "Application",
            workspaceId: "ws-a",
            status: "PUBLISHED",
          },
        ],
        hasMore: false,
      });
    }
    if (url.pathname === "/forms/form-a") {
      return json({
        id: "form-a",
        name: "Application",
        workspaceId: options?.workspaceId ?? "ws-a",
        status: "PUBLISHED",
        blocks: options?.requiredPhone
          ? [{ type: "INPUT_PHONE_NUMBER", payload: { isRequired: true } }]
          : [],
      });
    }
    if (url.pathname === "/forms/form-a/questions") {
      return json({
        questions: [
          {
            id: "q-name",
            title: "Name",
            type: "INPUT_TEXT",
            fields: [{ type: "INPUT_TEXT" }],
          },
          {
            id: "q-phone",
            title: "Telefon",
            type: "INPUT_PHONE_NUMBER",
            fields: [{ type: "INPUT_PHONE_NUMBER" }],
          },
        ],
      });
    }
    return new Response(null, { status: 404 });
  });
}

test("loads resources and questions with a pinned API version", async () => {
  const fetcher = tallyFetch();
  const client = createTallyClient(
    "token-a",
    fetcher as unknown as typeof fetch,
  );

  const resources = await client.resources();
  const questions = await client.questions("ws-a", "form-a");

  expect(resources.workspaces[0]?.name).toBe("Workspace A");
  expect(questions).toEqual([
    { id: "q-name", title: "Name", type: "INPUT_TEXT" },
  ]);
  for (const call of fetcher.mock.calls) {
    const headers = new Headers(call[1]?.headers);
    expect(headers.get("tally-version")).toBe(TALLY_API_VERSION);
    expect(headers.get("authorization")).toBe("Bearer token-a");
  }
});

test("rejects a form outside the selected workspace", async () => {
  const fetcher = tallyFetch({ workspaceId: "ws-b" });
  const client = createTallyClient("token", fetcher as unknown as typeof fetch);
  await expect(client.questions("ws-a", "form-a")).rejects.toThrow(
    "does not belong to this workspace",
  );
});

test("rejects a base form that requires a phone number", async () => {
  const fetcher = tallyFetch({ requiredPhone: true });
  const client = createTallyClient("token", fetcher as unknown as typeof fetch);
  await expect(client.questions("ws-a", "form-a")).rejects.toThrow(
    "requires a phone number",
  );
});

test("requires a Tally API token", () => {
  expect(() => createTallyClient("")).toThrow("Tally API token is required");
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
